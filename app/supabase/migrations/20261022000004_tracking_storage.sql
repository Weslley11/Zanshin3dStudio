-- Zanshin 3D Studio · acompanhamento público, fotos e preparo da fase 2

-- ---------------------------------------------------------------- acompanhamento
-- O cliente abre /acompanhar/<token> sem login. A única porta para o anon é esta
-- função: ela devolve só número, itens (descrição e quantidade), linha do tempo,
-- prazo, entrega e fotos quando a peça estiver pronta. Nada de valores, custos,
-- margens, nome ou contato do cliente.

create or replace function public.public_order_tracking(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  o public.orders;
  s public.settings;
begin
  if p_token is null or length(p_token) < 20 then
    return null;
  end if;

  select * into o from public.orders where public_token = p_token;
  if not found then
    return null;
  end if;
  select * into s from public.settings where id = 1;

  return jsonb_build_object(
    'number', public.format_doc_number(o.number),
    'status', o.status,
    'created_at', o.created_at,
    'due_date', o.due_date,
    'delivery_method', o.delivery_method,
    'tracking_code', case when o.delivery_method = 'correios' then o.tracking_code end,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('description', i.description, 'quantity', i.quantity) order by i.position)
        from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('status', e.to_status, 'at', e.created_at) order by e.created_at)
        from public.order_events e where e.order_id = o.id), '[]'::jsonb),
    'photos', case when o.status in ('pronto', 'entregue') then coalesce((
      select jsonb_agg(p.path order by p.created_at)
        from public.order_photos p where p.order_id = o.id and p.show_to_customer), '[]'::jsonb)
      else '[]'::jsonb end,
    'business', jsonb_build_object(
      'name', s.business_name,
      'whatsapp', s.business_whatsapp,
      'instagram', s.business_instagram)
  );
end;
$$;

revoke execute on function public.public_order_tracking(text) from public;
grant execute on function public.public_order_tracking(text) to anon, authenticated;

-- ---------------------------------------------------------------- fotos
-- Bucket público para as fotos de peça pronta e do catálogo. O arquivo é
-- servido pela URL pública, mas o caminho leva um UUID aleatório e o anon não
-- tem permissão de listar, então só vê a foto quem recebeu o caminho pela
-- função acima. Enviar, trocar e apagar é só do dono.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "dono lista fotos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_owner());
create policy "dono envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_owner());
create policy "dono altera fotos" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_owner());
create policy "dono apaga fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_owner());

-- ---------------------------------------------------------------- fase 2: pedidos do site
-- Ainda sem uso. Quando o formulário do site mandar pedidos direto para o app,
-- eles caem aqui (via Edge Function com validação, não por insert anônimo).

create table public.site_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  whatsapp text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'novo' check (status in ('novo', 'virou_orcamento', 'descartado')),
  customer_id uuid references public.customers (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.site_requests enable row level security;
create policy "dono" on public.site_requests for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
