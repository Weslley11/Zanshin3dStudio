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
