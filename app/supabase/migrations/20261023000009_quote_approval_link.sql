-- Zanshin 3D Studio · o cliente vê e aprova o orçamento pelo link
--
-- Cada orçamento ganha um token aleatório (como o do acompanhamento). O anon só
-- chega aos dados por estas funções: vê peças, preços e total (nunca custos,
-- margens ou anotações internas) e aprova; a aprovação cria o pedido igual ao
-- botão "Aprovado: criar pedido" do app.

alter table public.quotes
  add column public_token text unique default public.random_token(),
  add column approved_via text check (approved_via in ('dono', 'cliente')),
  add column client_viewed_at timestamptz;

update public.quotes set public_token = public.random_token() where public_token is null;
alter table public.quotes alter column public_token set not null;

-- "hoje" no fuso do estúdio, para a validade
create or replace function public.today_sp()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.public_quote(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  q public.quotes;
  s public.settings;
  first_name text;
  order_token text;
begin
  if p_token is null or length(p_token) < 20 then
    return null;
  end if;
  select * into q from public.quotes where public_token = p_token;
  if not found then
    return null;
  end if;
  select * into s from public.settings where id = 1;
  select split_part(trim(c.name), ' ', 1) into first_name from public.customers c where c.id = q.customer_id;
  select o.public_token into order_token from public.orders o where o.quote_id = q.id;

  return jsonb_build_object(
    'number', public.format_doc_number(q.number),
    'status', q.status,
    'expired', q.status in ('rascunho', 'enviado') and q.valid_until is not null and q.valid_until < public.today_sp(),
    'valid_until', q.valid_until,
    'created_at', q.created_at,
    'customer_first_name', first_name,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'description', i.description,
               'quantity', i.quantity,
               'unit_price', i.unit_price,
               'line_total', i.line_total,
               'material', f.material,
               'color_name', f.color_name,
               'color_hex', f.color_hex) order by i.position)
        from public.quote_items i
        left join public.filaments f on f.id = i.filament_id
       where i.quote_id = q.id), '[]'::jsonb),
    'items_total', q.items_total,
    'delivery_fee', q.delivery_fee,
    'total', q.total,
    'notes', q.notes,
    'order_token', order_token,
    'business', jsonb_build_object('name', s.business_name, 'whatsapp', s.business_whatsapp, 'instagram', s.business_instagram)
  );
end;
$$;

-- O cliente abriu o link: guarda a primeira vez (o app mostra "visto em").
create or replace function public.public_quote_seen(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.quotes
     set client_viewed_at = coalesce(client_viewed_at, now())
   where public_token = p_token and length(p_token) >= 20;
$$;

create or replace function public.public_approve_quote(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotes;
  new_order uuid;
  token text;
begin
  if p_token is null or length(p_token) < 20 then
    raise exception 'Orçamento não encontrado';
  end if;
  select * into q from public.quotes where public_token = p_token for update;
  if not found then
    raise exception 'Orçamento não encontrado';
  end if;

  -- aprovar de novo só devolve o pedido que já existe
  if q.status = 'aprovado' then
    select public_token into token from public.orders where quote_id = q.id;
    return jsonb_build_object('order_token', token, 'already', true);
  end if;
  if q.status = 'recusado' then
    raise exception 'Este orçamento foi encerrado. Fale com a gente pelo WhatsApp para um novo.';
  end if;
  if q.valid_until is not null and q.valid_until < public.today_sp() then
    raise exception 'Este orçamento venceu em %. Fale com a gente pelo WhatsApp para atualizar.', to_char(q.valid_until, 'DD/MM/YYYY');
  end if;

  new_order := public.convert_quote_to_order(q.id);
  update public.quotes set approved_via = 'cliente' where id = q.id;
  update public.order_events set note = 'Aprovado pelo cliente no link do orçamento'
   where order_id = new_order and from_status is null;

  select public_token into token from public.orders where id = new_order;
  return jsonb_build_object('order_token', token, 'already', false);
end;
$$;

revoke execute on function public.public_quote(text) from public;
revoke execute on function public.public_quote_seen(text) from public;
revoke execute on function public.public_approve_quote(text) from public;
grant execute on function public.public_quote(text) to anon, authenticated;
grant execute on function public.public_quote_seen(text) to anon, authenticated;
grant execute on function public.public_approve_quote(text) to anon, authenticated;
