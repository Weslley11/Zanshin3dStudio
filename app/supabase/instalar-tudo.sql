-- =====================================================================
--  INSTALAÇÃO COMPLETA DO BANCO · Zanshin 3D Studio
-- ---------------------------------------------------------------------
--  Gerado por scripts/bundle-sql.mjs a partir de supabase/migrations
--  (não edite à mão). Para usar num projeto NOVO e vazio do Supabase:
--  SQL Editor → New query → cole este arquivo inteiro → Run.
--  Rodar duas vezes no mesmo projeto dá erro de "já existe".
-- =====================================================================

-- ---------------------------------------------------------------- 20261022000001_core.sql

-- Zanshin 3D Studio · núcleo: dono, configurações, impressoras, clientes, filamentos
--
-- O app tem um único usuário (o dono). Todas as tabelas têm RLS e só liberam
-- acesso quando auth.uid() está em app_owner. O primeiro usuário autenticado
-- que chamar claim_ownership() vira o dono; depois disso ninguém mais entra,
-- mesmo que o cadastro público seja ligado por engano no painel do Supabase.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- dono

create table public.app_owner (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_owner enable row level security;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_owner where user_id = auth.uid());
$$;

create policy "dono lê o próprio registro" on public.app_owner
  for select to authenticated using (user_id = auth.uid());

create or replace function public.claim_ownership()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  -- trava para dois logins simultâneos não virarem dono ao mesmo tempo
  lock table public.app_owner in exclusive mode;
  if not exists (select 1 from public.app_owner) then
    insert into public.app_owner (user_id) values (auth.uid());
  end if;
  return public.is_owner();
end;
$$;

revoke execute on function public.claim_ownership() from public, anon;
grant execute on function public.claim_ownership() to authenticated;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- configurações
-- Uma linha só (id = 1). Os parâmetros de preço começam vazios de propósito:
-- o dono preenche no primeiro acesso e a calculadora avisa o que falta.

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  business_name text not null default 'Zanshin 3D Studio',
  business_whatsapp text,             -- só dígitos, com 55 e DDD
  business_instagram text,            -- sem @
  energy_tariff numeric(10, 4),       -- R$/kWh
  labor_rate numeric(10, 2),          -- R$/h de pós-processamento
  failure_rate_pct numeric(6, 2),     -- % aplicado sobre o custo
  margin_pct numeric(7, 2),           -- % de margem
  urgency_pct numeric(6, 2),          -- % a mais quando a peça é urgente
  rounding text check (rounding in ('90', '00')),
  quote_validity_days integer check (quote_validity_days > 0),
  low_stock_default_g numeric(10, 1) check (low_stock_default_g >= 0),
  default_printer_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "dono" on public.settings for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- O contato do estúdio é um dado real (o mesmo do site), não um parâmetro de preço.
insert into public.settings (id, business_whatsapp, business_instagram)
values (1, '5547991677070', 'zanshin_3dstudio');

-- ---------------------------------------------------------------- impressoras
-- Hoje só a P2S, mas a fila e os custos já referenciam a impressora.

create table public.printers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  model text,
  power_kw numeric(8, 4) check (power_kw >= 0),        -- potência média
  wear_per_hour numeric(10, 2) check (wear_per_hour >= 0), -- desgaste R$/h
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.printers enable row level security;
create policy "dono" on public.printers for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger printers_touch before update on public.printers
  for each row execute function public.touch_updated_at();

alter table public.settings
  add constraint settings_default_printer_fk
  foreign key (default_printer_id) references public.printers (id) on delete set null;

-- A impressora existe; potência e desgaste ficam vazios para o dono preencher.
with p as (
  insert into public.printers (name, model) values ('P2S', 'Bambu Lab P2S') returning id
)
update public.settings set default_printer_id = (select id from p) where id = 1;

-- ---------------------------------------------------------------- clientes

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  whatsapp text,                      -- só dígitos
  instagram text,                     -- sem @
  city text,
  origin text check (origin in ('site', 'instagram', 'whatsapp', 'indicacao', 'feira', 'outro')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customers enable row level security;
create policy "dono" on public.customers for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();
create index customers_name_idx on public.customers (lower(name));

-- ---------------------------------------------------------------- filamentos

create table public.filaments (
  id uuid primary key default gen_random_uuid(),
  material text not null check (material in ('PLA', 'PETG', 'ABS', 'ASA', 'TPU')),
  brand text not null,
  color_name text not null,
  color_hex text not null default '#9aa1ab' check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  price_paid numeric(10, 2) not null check (price_paid >= 0),
  initial_weight_g numeric(10, 1) not null check (initial_weight_g > 0),
  remaining_g numeric(10, 1) not null check (remaining_g >= 0),
  cost_per_g numeric(12, 6) generated always as (price_paid / initial_weight_g) stored,
  min_stock_g numeric(10, 1) check (min_stock_g >= 0), -- vazio = usa o mínimo padrão
  purchased_at date,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.filaments enable row level security;
create policy "dono" on public.filaments for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger filaments_touch before update on public.filaments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- 20261022000002_catalog_quotes.sql

-- Zanshin 3D Studio · catálogo e orçamentos

-- Número compartilhado entre orçamento e pedido: o orçamento ZAN-0007, quando
-- aprovado, vira o pedido ZAN-0007. Pedido criado sem orçamento pega o próximo.
create sequence public.doc_number_seq start 1;

create or replace function public.format_doc_number(n integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'ZAN-' || lpad(n::text, 4, '0');
$$;

-- ---------------------------------------------------------------- catálogo

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('colecionaveis', 'tecnicas', 'utilidades', 'personalizadas')),
  description text,
  photo_path text,                      -- caminho no bucket "photos"
  grams numeric(10, 1) check (grams >= 0),
  print_minutes integer check (print_minutes >= 0),
  post_hours numeric(6, 2) check (post_hours >= 0),
  filament_id uuid references public.filaments (id) on delete set null,
  base_price numeric(10, 2) check (base_price >= 0),
  site_slug text,                       -- casa com o id da peça em js/pecas-data.js do site
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.catalog_items enable row level security;
create policy "dono" on public.catalog_items for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger catalog_touch before update on public.catalog_items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- orçamentos

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique default nextval('public.doc_number_seq'),
  customer_id uuid references public.customers (id) on delete set null,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'enviado', 'aprovado', 'recusado')),
  valid_until date,
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  items_total numeric(12, 2) not null default 0,
  total numeric(12, 2) generated always as (items_total + delivery_fee) stored,
  notes text,                           -- vai no texto do WhatsApp e no PDF
  internal_notes text,                  -- só para o dono
  sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter sequence public.doc_number_seq owned by public.quotes.number;
alter table public.quotes enable row level security;
create policy "dono" on public.quotes for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger quotes_touch before update on public.quotes
  for each row execute function public.touch_updated_at();
create index quotes_customer_idx on public.quotes (customer_id);

-- Cada item guarda as entradas, uma cópia dos parâmetros usados no cálculo e o
-- detalhamento do custo por unidade. Assim mudar a tarifa amanhã não altera o
-- orçamento de ontem, e o financeiro sabe o custo real de cada venda.
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  position integer not null default 0,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  category text check (category in ('colecionaveis', 'tecnicas', 'utilidades', 'personalizadas')),
  filament_id uuid references public.filaments (id) on delete set null,
  printer_id uuid references public.printers (id) on delete set null,
  grams numeric(10, 1) not null check (grams >= 0),
  print_minutes integer not null check (print_minutes >= 0),
  quantity integer not null default 1 check (quantity > 0),
  post_hours numeric(6, 2) not null default 0 check (post_hours >= 0),
  extras jsonb not null default '[]'::jsonb,   -- [{"label": "Ímã", "amount": 1.5}] por unidade
  urgent boolean not null default false,
  -- parâmetros usados (cópia)
  params jsonb not null default '{}'::jsonb,
  -- detalhamento por unidade
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
alter table public.quote_items enable row level security;
create policy "dono" on public.quote_items for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create index quote_items_quote_idx on public.quote_items (quote_id, position);

create or replace function public.recalc_quote_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  qid uuid := coalesce(new.quote_id, old.quote_id);
begin
  update public.quotes
     set items_total = coalesce((select sum(line_total) from public.quote_items where quote_id = qid), 0)
   where id = qid;
  if tg_op = 'UPDATE' and new.quote_id is distinct from old.quote_id then
    update public.quotes
       set items_total = coalesce((select sum(line_total) from public.quote_items where quote_id = old.quote_id), 0)
     where id = old.quote_id;
  end if;
  return null;
end;
$$;

create trigger quote_items_total after insert or update or delete on public.quote_items
  for each row execute function public.recalc_quote_total();

-- ---------------------------------------------------------------- 20261022000003_orders_queue.sql

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

-- ---------------------------------------------------------------- 20261022000004_tracking_storage.sql

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

-- ---------------------------------------------------------------- 20261022000005_save_quote.sql

-- Zanshin 3D Studio · salvar orçamento de uma vez (cabeçalho + itens)
--
-- O app manda o orçamento inteiro; a função grava o cabeçalho e troca os itens
-- numa transação só, para nunca sobrar orçamento pela metade.

create or replace function public.save_quote(p_quote jsonb, p_items jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  qid uuid := nullif(p_quote ->> 'id', '')::uuid;
  current_status text;
begin
  if qid is null then
    insert into public.quotes (customer_id, valid_until, delivery_fee, notes, internal_notes)
    values (
      nullif(p_quote ->> 'customer_id', '')::uuid,
      nullif(p_quote ->> 'valid_until', '')::date,
      coalesce((p_quote ->> 'delivery_fee')::numeric, 0),
      nullif(p_quote ->> 'notes', ''),
      nullif(p_quote ->> 'internal_notes', ''))
    returning id into qid;
  else
    select status into current_status from public.quotes where id = qid for update;
    if not found then
      raise exception 'Orçamento não encontrado';
    end if;
    if current_status = 'aprovado' then
      raise exception 'Orçamento aprovado não pode ser alterado: ele já virou pedido';
    end if;
    update public.quotes
       set customer_id = nullif(p_quote ->> 'customer_id', '')::uuid,
           valid_until = nullif(p_quote ->> 'valid_until', '')::date,
           delivery_fee = coalesce((p_quote ->> 'delivery_fee')::numeric, 0),
           notes = nullif(p_quote ->> 'notes', ''),
           internal_notes = nullif(p_quote ->> 'internal_notes', '')
     where id = qid;
    delete from public.quote_items where quote_id = qid;
  end if;

  insert into public.quote_items (
    quote_id, position, catalog_item_id, description, category, filament_id, printer_id,
    grams, print_minutes, quantity, post_hours, extras, urgent, params,
    material_cost, energy_cost, machine_cost, labor_cost, extras_total,
    calculated_unit_price, override_unit_price)
  select qid, (i.ord - 1)::int,
         nullif(i.item ->> 'catalog_item_id', '')::uuid,
         i.item ->> 'description',
         nullif(i.item ->> 'category', ''),
         nullif(i.item ->> 'filament_id', '')::uuid,
         nullif(i.item ->> 'printer_id', '')::uuid,
         coalesce((i.item ->> 'grams')::numeric, 0),
         coalesce((i.item ->> 'print_minutes')::int, 0),
         greatest(coalesce((i.item ->> 'quantity')::int, 1), 1),
         coalesce((i.item ->> 'post_hours')::numeric, 0),
         coalesce(i.item -> 'extras', '[]'::jsonb),
         coalesce((i.item ->> 'urgent')::boolean, false),
         coalesce(i.item -> 'params', '{}'::jsonb),
         coalesce((i.item ->> 'material_cost')::numeric, 0),
         coalesce((i.item ->> 'energy_cost')::numeric, 0),
         coalesce((i.item ->> 'machine_cost')::numeric, 0),
         coalesce((i.item ->> 'labor_cost')::numeric, 0),
         coalesce((i.item ->> 'extras_total')::numeric, 0),
         coalesce((i.item ->> 'calculated_unit_price')::numeric, 0),
         nullif(i.item ->> 'override_unit_price', '')::numeric
    from jsonb_array_elements(p_items) with ordinality as i(item, ord);

  return qid;
end;
$$;

revoke execute on function public.save_quote(jsonb, jsonb) from public, anon;
grant execute on function public.save_quote(jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------- 20261023000006_models.sql

-- Zanshin 3D Studio · modelos 3D (aba Modelos)
--
-- Guarda os arquivos STL, 3MF, OBJ e os .gcode.3mf fatiados no Bambu Studio,
-- com medidas, volume e, no caso do .gcode.3mf, as placas com tempo e gramas
-- que o próprio fatiador calculou.

-- ---------------------------------------------------------------- área de impressão
-- Para avisar quando a peça não cabe na mesa.

alter table public.printers
  add column bed_x_mm numeric(7, 1) check (bed_x_mm > 0),
  add column bed_y_mm numeric(7, 1) check (bed_y_mm > 0),
  add column bed_z_mm numeric(7, 1) check (bed_z_mm > 0);

-- Volume de impressão da P2S segundo a Bambu Lab (dado de fábrica, editável).
update public.printers
   set bed_x_mm = 256, bed_y_mm = 256, bed_z_mm = 256
 where model = 'Bambu Lab P2S' and bed_x_mm is null;

-- ---------------------------------------------------------------- modelos

create table public.models (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  file_path text not null,                -- caminho no bucket privado "models"
  file_name text not null,
  file_size bigint,
  format text not null check (format in ('stl', '3mf', 'obj', 'gcode.3mf')),
  thumbnail_path text,                    -- miniatura no bucket "photos"
  size_x_mm numeric(9, 2),
  size_y_mm numeric(9, 2),
  size_z_mm numeric(9, 2),
  volume_cm3 numeric(12, 3),
  area_cm2 numeric(12, 3),
  triangles integer,
  parts integer,                          -- peças separadas no arquivo (as medidas são da maior)
  -- placas do .gcode.3mf: [{"index":1,"minutes":91,"grams":25.4,
  --   "filaments":[{"type":"PLA","color":"#FFFFFF","grams":25.4,"meters":8.5}],
  --   "thumbnail_path":"..."}]
  plates jsonb not null default '[]'::jsonb,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.models enable row level security;
create policy "dono" on public.models for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create trigger models_touch before update on public.models
  for each row execute function public.touch_updated_at();
create index models_order_idx on public.models (order_id);
create index models_catalog_idx on public.models (catalog_item_id);

-- placa da fila que veio de um modelo
alter table public.print_jobs
  add column model_id uuid references public.models (id) on delete set null;

-- ---------------------------------------------------------------- arquivos
-- Bucket privado: os modelos são dos clientes. Só o dono envia, lê e apaga;
-- o download usa link assinado temporário.

insert into storage.buckets (id, name, public, file_size_limit)
values ('models', 'models', false, 52428800)
on conflict (id) do nothing;

create policy "dono lê modelos" on storage.objects for select to authenticated
  using (bucket_id = 'models' and public.is_owner());
create policy "dono envia modelos" on storage.objects for insert to authenticated
  with check (bucket_id = 'models' and public.is_owner());
create policy "dono altera modelos" on storage.objects for update to authenticated
  using (bucket_id = 'models' and public.is_owner());
create policy "dono apaga modelos" on storage.objects for delete to authenticated
  using (bucket_id = 'models' and public.is_owner());

-- ---------------------------------------------------------------- 20261023000007_backup_messages.sql

-- Zanshin 3D Studio · mensagens prontas para o cliente e lembrete de backup

alter table public.settings
  -- textos editados pelo dono; chave ausente = texto padrão do app
  add column message_templates jsonb not null default '{}'::jsonb,
  -- último backup baixado (o app lembra quando faz tempo)
  add column last_backup_at timestamptz;

-- ---------------------------------------------------------------- 20261023000008_order_editing.sql

-- Zanshin 3D Studio · pedido sem orçamento e edição dos itens de um pedido
--
-- save_order grava cabeçalho e itens numa transação só. Sem id, cria o pedido
-- (número novo da mesma sequência ZAN-...). Com id, atualiza cliente e taxa de
-- entrega e sincroniza os itens: os que vieram com id existente são
-- atualizados (as placas da fila continuam ligadas a eles), os novos entram e
-- os que sumiram da lista saem.

create or replace function public.save_order(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  oid uuid := nullif(p_order ->> 'id', '')::uuid;
  current_status text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa ter pelo menos uma peça';
  end if;

  if oid is null then
    insert into public.orders (customer_id, due_date, delivery_method, delivery_fee, payment_method, notes)
    values (
      nullif(p_order ->> 'customer_id', '')::uuid,
      nullif(p_order ->> 'due_date', '')::date,
      nullif(p_order ->> 'delivery_method', ''),
      coalesce((p_order ->> 'delivery_fee')::numeric, 0),
      nullif(p_order ->> 'payment_method', ''),
      nullif(p_order ->> 'notes', ''))
    returning id into oid;
  else
    select status into current_status from public.orders where id = oid for update;
    if not found then
      raise exception 'Pedido não encontrado';
    end if;
    if current_status = 'cancelado' then
      raise exception 'Pedido cancelado não pode ser alterado. Reabra o pedido antes.';
    end if;
    update public.orders
       set customer_id = nullif(p_order ->> 'customer_id', '')::uuid,
           delivery_fee = coalesce((p_order ->> 'delivery_fee')::numeric, 0)
     where id = oid;
  end if;

  -- itens que saíram da lista
  delete from public.order_items oi
   where oi.order_id = oid
     and oi.id not in (
       select nullif(i ->> 'id', '')::uuid from jsonb_array_elements(p_items) i where nullif(i ->> 'id', '') is not null);

  insert into public.order_items (
    id, order_id, position, catalog_item_id, description, category, filament_id, printer_id,
    grams, print_minutes, quantity, post_hours, extras, urgent, params,
    material_cost, energy_cost, machine_cost, labor_cost, extras_total,
    calculated_unit_price, override_unit_price)
  select coalesce(nullif(i.item ->> 'id', '')::uuid, gen_random_uuid()), oid, (i.ord - 1)::int,
         nullif(i.item ->> 'catalog_item_id', '')::uuid,
         i.item ->> 'description',
         nullif(i.item ->> 'category', ''),
         nullif(i.item ->> 'filament_id', '')::uuid,
         nullif(i.item ->> 'printer_id', '')::uuid,
         coalesce((i.item ->> 'grams')::numeric, 0),
         coalesce((i.item ->> 'print_minutes')::int, 0),
         greatest(coalesce((i.item ->> 'quantity')::int, 1), 1),
         coalesce((i.item ->> 'post_hours')::numeric, 0),
         coalesce(i.item -> 'extras', '[]'::jsonb),
         coalesce((i.item ->> 'urgent')::boolean, false),
         coalesce(i.item -> 'params', '{}'::jsonb),
         coalesce((i.item ->> 'material_cost')::numeric, 0),
         coalesce((i.item ->> 'energy_cost')::numeric, 0),
         coalesce((i.item ->> 'machine_cost')::numeric, 0),
         coalesce((i.item ->> 'labor_cost')::numeric, 0),
         coalesce((i.item ->> 'extras_total')::numeric, 0),
         coalesce((i.item ->> 'calculated_unit_price')::numeric, 0),
         nullif(i.item ->> 'override_unit_price', '')::numeric
    from jsonb_array_elements(p_items) with ordinality as i(item, ord)
  on conflict (id) do update set
    position = excluded.position,
    catalog_item_id = excluded.catalog_item_id,
    description = excluded.description,
    category = excluded.category,
    filament_id = excluded.filament_id,
    printer_id = excluded.printer_id,
    grams = excluded.grams,
    print_minutes = excluded.print_minutes,
    quantity = excluded.quantity,
    post_hours = excluded.post_hours,
    extras = excluded.extras,
    urgent = excluded.urgent,
    params = excluded.params,
    material_cost = excluded.material_cost,
    energy_cost = excluded.energy_cost,
    machine_cost = excluded.machine_cost,
    labor_cost = excluded.labor_cost,
    extras_total = excluded.extras_total,
    calculated_unit_price = excluded.calculated_unit_price,
    override_unit_price = excluded.override_unit_price
  -- um item de outro pedido nunca é sobrescrito
  where public.order_items.order_id = excluded.order_id;

  return oid;
end;
$$;

revoke execute on function public.save_order(jsonb, jsonb) from public, anon;
grant execute on function public.save_order(jsonb, jsonb) to authenticated;
