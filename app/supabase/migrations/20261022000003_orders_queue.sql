-- Zanshin 3D Studio · pedidos, pagamentos, fila de impressão e falhas

create or replace function public.random_token()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 18 bytes aleatórios = 24 caracteres seguros para URL
  select translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_');
$$;

-- ---------------------------------------------------------------- pedidos

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique default nextval('public.doc_number_seq'),
  quote_id uuid unique references public.quotes (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  status text not null default 'aprovado'
    check (status in ('aprovado', 'na_fila', 'imprimindo', 'pos_processamento', 'pronto', 'entregue', 'cancelado')),
  due_date date,
  delivery_method text check (delivery_method in ('retirada', 'motoboy', 'correios')),
  tracking_code text,
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  items_total numeric(12, 2) not null default 0,
  total numeric(12, 2) generated always as (items_total + delivery_fee) stored,
  paid_total numeric(12, 2) not null default 0,
  payment_method text check (payment_method in ('pix', 'dinheiro', 'cartao')),
  notes text,
  public_token text not null unique default public.random_token(),
  status_changed_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "dono" on public.orders for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create index orders_status_idx on public.orders (status);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  position integer not null default 0,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  category text check (category in ('colecionaveis', 'tecnicas', 'utilidades', 'personalizadas')),
  filament_id uuid references public.filaments (id) on delete set null,
  printer_id uuid references public.printers (id) on delete set null,
  grams numeric(10, 1) not null default 0 check (grams >= 0),
  print_minutes integer not null default 0 check (print_minutes >= 0),
  quantity integer not null default 1 check (quantity > 0),
  post_hours numeric(6, 2) not null default 0 check (post_hours >= 0),
  extras jsonb not null default '[]'::jsonb,
  urgent boolean not null default false,
  params jsonb not null default '{}'::jsonb,
  material_cost numeric(12, 4) not null default 0,
  energy_cost numeric(12, 4) not null default 0,
  machine_cost numeric(12, 4) not null default 0,
  labor_cost numeric(12, 4) not null default 0,
  extras_total numeric(12, 4) not null default 0,
  calculated_unit_price numeric(12, 2) not null default 0,
  override_unit_price numeric(12, 2) check (override_unit_price >= 0),
  unit_price numeric(12, 2) generated always as (coalesce(override_unit_price, calculated_unit_price)) stored,
  line_total numeric(12, 2) generated always as (coalesce(override_unit_price, calculated_unit_price) * quantity) stored,
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
create policy "dono" on public.order_items for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create index order_items_order_idx on public.order_items (order_id, position);

create or replace function public.recalc_order_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  oid uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders
     set items_total = coalesce((select sum(line_total) from public.order_items where order_id = oid), 0)
   where id = oid;
  return null;
end;
$$;
create trigger order_items_total after insert or update or delete on public.order_items
  for each row execute function public.recalc_order_total();

-- ---------------------------------------------------------------- pagamentos

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null check (method in ('pix', 'dinheiro', 'cartao')),
  kind text not null default 'sinal' check (kind in ('sinal', 'restante', 'outro')),
  paid_at date not null default (now() at time zone 'America/Sao_Paulo')::date,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "dono" on public.payments for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create index payments_order_idx on public.payments (order_id);

create or replace function public.recalc_order_paid()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  oid uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders
     set paid_total = coalesce((select sum(amount) from public.payments where order_id = oid), 0)
   where id = oid;
  return null;
end;
$$;
create trigger payments_paid after insert or update or delete on public.payments
  for each row execute function public.recalc_order_paid();

-- ---------------------------------------------------------------- fotos do pedido

create table public.order_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  path text not null,                         -- caminho no bucket "photos"
  show_to_customer boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.order_photos enable row level security;
create policy "dono" on public.order_photos for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create index order_photos_order_idx on public.order_photos (order_id);

-- ---------------------------------------------------------------- histórico de status

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default clock_timestamp()
);
alter table public.order_events enable row level security;
create policy "dono" on public.order_events for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------- fila de impressão
-- Uma linha por placa. Um pedido pode ter várias; também dá para enfileirar
-- placa sem pedido (estoque para feira, teste). As colunas source/meta já
-- recebem, na fase 2, o que vier do .gcode.3mf do Bambu Studio.

create table public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete set null,
  printer_id uuid references public.printers (id) on delete set null,
  filament_id uuid references public.filaments (id) on delete set null,
  title text not null,
  grams numeric(10, 1) not null default 0 check (grams >= 0),
  print_minutes integer not null default 0 check (print_minutes >= 0),
  position double precision not null default extract(epoch from now()),
  status text not null default 'na_fila'
    check (status in ('na_fila', 'imprimindo', 'concluida', 'cancelada')),
  started_at timestamptz,
  finished_at timestamptz,
  deducted_g numeric(10, 1),                  -- quanto saiu do carretel ao concluir
  source text not null default 'manual' check (source in ('manual', '3mf')),
  source_file_path text,
  plate_index integer,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.print_jobs enable row level security;
create policy "dono" on public.print_jobs for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger print_jobs_touch before update on public.print_jobs
  for each row execute function public.touch_updated_at();
create index print_jobs_queue_idx on public.print_jobs (status, position);
-- uma placa imprimindo por vez em cada impressora
create unique index print_jobs_one_running on public.print_jobs (printer_id) where status = 'imprimindo';

-- ---------------------------------------------------------------- falhas

create table public.failures (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  print_job_id uuid references public.print_jobs (id) on delete set null,
  printer_id uuid references public.printers (id) on delete set null,
  filament_id uuid references public.filaments (id) on delete set null,
  grams_lost numeric(10, 1) not null default 0 check (grams_lost >= 0),
  minutes_lost integer not null default 0 check (minutes_lost >= 0),
  reason text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.failures enable row level security;
create policy "dono" on public.failures for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create index failures_date_idx on public.failures (occurred_at);

-- O filamento perdido sai do carretel; apagar o registro devolve.
create or replace function public.failures_adjust_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.filament_id is not null then
    update public.filaments set remaining_g = remaining_g + old.grams_lost where id = old.filament_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.filament_id is not null then
    update public.filaments set remaining_g = greatest(0, remaining_g - new.grams_lost) where id = new.filament_id;
  end if;
  return null;
end;
$$;
create trigger failures_stock after insert or update or delete on public.failures
  for each row execute function public.failures_adjust_stock();

-- ---------------------------------------------------------------- regras de status

-- Registra cada mudança de status e, ao entrar em "Na fila", cria as placas a
-- partir dos itens (uma por item, com gramas e tempo multiplicados pela
-- quantidade) se o pedido ainda não tiver nenhuma. O dono pode dividir depois.
create or replace function public.orders_status_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  default_printer uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, from_status, to_status) values (new.id, null, new.status);
    return null;
  end if;

  if new.status is distinct from old.status then
    insert into public.order_events (order_id, from_status, to_status) values (new.id, old.status, new.status);

    if new.status = 'na_fila'
       and not exists (select 1 from public.print_jobs where order_id = new.id and status <> 'cancelada') then
      select default_printer_id into default_printer from public.settings where id = 1;
      insert into public.print_jobs (order_id, order_item_id, printer_id, filament_id, title, grams, print_minutes, position)
      select new.id, oi.id, coalesce(oi.printer_id, default_printer), oi.filament_id,
             oi.description || case when oi.quantity > 1 then ' (' || oi.quantity || ' un.)' else '' end,
             oi.grams * oi.quantity, oi.print_minutes * oi.quantity,
             extract(epoch from now()) + oi.position * 0.001
        from public.order_items oi
       where oi.order_id = new.id and oi.print_minutes > 0
       order by oi.position;
    end if;

    if new.status = 'cancelado' then
      update public.print_jobs set status = 'cancelada' where order_id = new.id and status = 'na_fila';
    end if;
  end if;
  return null;
end;
$$;
create trigger orders_status after insert or update of status on public.orders
  for each row execute function public.orders_status_rules();

create or replace function public.orders_status_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
    if new.status = 'entregue' then
      new.delivered_at = coalesce(new.delivered_at, now());
    elsif old.status = 'entregue' then
      new.delivered_at = null;
    end if;
  end if;
  return new;
end;
$$;
create trigger orders_status_stamp before update of status on public.orders
  for each row execute function public.orders_status_stamp();

-- ---------------------------------------------------------------- ações (RPC)
-- Todas rodam com as permissões de quem chama (security invoker), então o RLS
-- de dono vale aqui dentro também.

create or replace function public.convert_quote_to_order(p_quote_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  q public.quotes;
  new_order uuid;
begin
  select * into q from public.quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Orçamento não encontrado';
  end if;
  if exists (select 1 from public.orders where quote_id = p_quote_id) then
    raise exception 'Este orçamento já virou pedido';
  end if;
  if not exists (select 1 from public.quote_items where quote_id = p_quote_id) then
    raise exception 'O orçamento não tem itens';
  end if;

  insert into public.orders (number, quote_id, customer_id, delivery_fee, notes)
  values (q.number, q.id, q.customer_id, q.delivery_fee, q.notes)
  returning id into new_order;

  insert into public.order_items (
    order_id, position, catalog_item_id, description, category, filament_id, printer_id,
    grams, print_minutes, quantity, post_hours, extras, urgent, params,
    material_cost, energy_cost, machine_cost, labor_cost, extras_total,
    calculated_unit_price, override_unit_price)
  select new_order, position, catalog_item_id, description, category, filament_id, printer_id,
         grams, print_minutes, quantity, post_hours, extras, urgent, params,
         material_cost, energy_cost, machine_cost, labor_cost, extras_total,
         calculated_unit_price, override_unit_price
    from public.quote_items where quote_id = p_quote_id order by position;

  update public.quotes set status = 'aprovado', approved_at = now() where id = p_quote_id;
  return new_order;
end;
$$;

create or replace function public.start_print_job(p_job_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  j public.print_jobs;
begin
  select * into j from public.print_jobs where id = p_job_id for update;
  if not found then raise exception 'Placa não encontrada'; end if;
  if j.status <> 'na_fila' then raise exception 'Esta placa não está na fila'; end if;
  if exists (select 1 from public.print_jobs where status = 'imprimindo' and printer_id is not distinct from j.printer_id) then
    raise exception 'Já tem uma placa imprimindo nesta impressora';
  end if;

  update public.print_jobs set status = 'imprimindo', started_at = now() where id = p_job_id;
  if j.order_id is not null then
    update public.orders set status = 'imprimindo'
     where id = j.order_id and status in ('aprovado', 'na_fila');
  end if;
end;
$$;

create or replace function public.complete_print_job(p_job_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  j public.print_jobs;
  used numeric;
begin
  select * into j from public.print_jobs where id = p_job_id for update;
  if not found then raise exception 'Placa não encontrada'; end if;
  if j.status not in ('na_fila', 'imprimindo') then raise exception 'Esta placa já foi encerrada'; end if;

  used := 0;
  if j.filament_id is not null then
    select least(remaining_g, j.grams) into used from public.filaments where id = j.filament_id for update;
    update public.filaments set remaining_g = remaining_g - coalesce(used, 0) where id = j.filament_id;
  end if;

  update public.print_jobs
     set status = 'concluida',
         started_at = coalesce(started_at, now()),
         finished_at = now(),
         deducted_g = coalesce(used, 0)
   where id = p_job_id;

  -- última placa do pedido: segue para pós-processamento
  if j.order_id is not null and not exists (
    select 1 from public.print_jobs where order_id = j.order_id and status in ('na_fila', 'imprimindo')
  ) then
    update public.orders set status = 'pos_processamento'
     where id = j.order_id and status in ('aprovado', 'na_fila', 'imprimindo');
  end if;
end;
$$;

-- Placa falhou: registra a perda (que sai do carretel pelo trigger) e devolve a
-- placa para o topo da fila, para reimprimir.
create or replace function public.fail_print_job(p_job_id uuid, p_grams_lost numeric, p_minutes_lost integer, p_reason text default null)
returns void
language plpgsql
set search_path = ''
as $$
declare
  j public.print_jobs;
begin
  select * into j from public.print_jobs where id = p_job_id for update;
  if not found then raise exception 'Placa não encontrada'; end if;
  if j.status not in ('na_fila', 'imprimindo') then raise exception 'Esta placa já foi encerrada'; end if;

  insert into public.failures (order_id, print_job_id, printer_id, filament_id, grams_lost, minutes_lost, reason)
  values (j.order_id, j.id, j.printer_id, j.filament_id, coalesce(p_grams_lost, 0), coalesce(p_minutes_lost, 0), nullif(trim(p_reason), ''));

  update public.print_jobs
     set status = 'na_fila', started_at = null,
         position = (select coalesce(min(position), extract(epoch from now())) - 1 from public.print_jobs where status = 'na_fila')
   where id = p_job_id;
end;
$$;

create or replace function public.reorder_print_jobs(p_ids uuid[])
returns void
language sql
set search_path = ''
as $$
  update public.print_jobs pj
     set position = o.ord
    from unnest(p_ids) with ordinality as o(id, ord)
   where pj.id = o.id;
$$;

revoke execute on function public.convert_quote_to_order(uuid) from public, anon;
revoke execute on function public.start_print_job(uuid) from public, anon;
revoke execute on function public.complete_print_job(uuid) from public, anon;
revoke execute on function public.fail_print_job(uuid, numeric, integer, text) from public, anon;
revoke execute on function public.reorder_print_jobs(uuid[]) from public, anon;
grant execute on function public.convert_quote_to_order(uuid) to authenticated;
grant execute on function public.start_print_job(uuid) to authenticated;
grant execute on function public.complete_print_job(uuid) to authenticated;
grant execute on function public.fail_print_job(uuid, numeric, integer, text) to authenticated;
grant execute on function public.reorder_print_jobs(uuid[]) to authenticated;

-- ---------------------------------------------------------------- resumo por cliente

create view public.customer_stats
with (security_invoker = true) as
select c.id as customer_id,
       count(o.id) filter (where o.status <> 'cancelado') as orders_count,
       coalesce(sum(o.total) filter (where o.status <> 'cancelado'), 0) as total_spent,
       max(o.created_at) as last_order_at
  from public.customers c
  left join public.orders o on o.customer_id = c.id
 group by c.id;
