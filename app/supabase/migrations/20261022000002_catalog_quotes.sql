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
