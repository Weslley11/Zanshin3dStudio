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
