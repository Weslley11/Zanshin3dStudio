-- =====================================================================
--  DADOS DE EXEMPLO · NÃO SÃO DADOS REAIS
-- ---------------------------------------------------------------------
--  Roda só no banco local (npx supabase db reset). Serve para ver o app
--  com movimento: clientes, carretéis, catálogo e pedidos fictícios.
--  Todo registro leva "(exemplo)" no nome ou nas observações.
--
--  Os parâmetros de preço abaixo também são EXEMPLO, inventados para
--  testar a calculadora. No projeto real eles começam vazios e o dono
--  preenche em Configurações. Nunca rode este arquivo em produção.
-- =====================================================================

update public.settings set
  energy_tariff = 0.95,        -- EXEMPLO
  labor_rate = 30,             -- EXEMPLO
  failure_rate_pct = 8,        -- EXEMPLO
  margin_pct = 120,            -- EXEMPLO
  urgency_pct = 25,            -- EXEMPLO
  rounding = '90',             -- EXEMPLO
  quote_validity_days = 7,     -- EXEMPLO
  low_stock_default_g = 200    -- EXEMPLO
where id = 1;

update public.printers set power_kw = 0.15, wear_per_hour = 1.20 where model = 'Bambu Lab P2S'; -- EXEMPLO

do $$
declare
  c_ana uuid; c_bruno uuid; c_carla uuid; c_diego uuid;
  f_preto uuid; f_branco uuid; f_vermelho uuid; f_petg uuid; f_cinza uuid;
  k_dragao uuid; k_suporte uuid; k_chaveiro uuid; k_organizador uuid;
  printer uuid;
  o uuid;
  i int;
  st text;
  sts text[] := array['entregue','entregue','entregue','entregue','entregue','entregue','entregue','pronto','pos_processamento','imprimindo','na_fila','aprovado'];
begin
  select default_printer_id into printer from public.settings where id = 1;

  insert into public.customers (name, whatsapp, instagram, city, origin, notes) values
    ('Ana Souza (exemplo)', '5547999990001', 'ana.exemplo', 'Jaraguá do Sul', 'instagram', 'Registro de exemplo') returning id into c_ana;
  insert into public.customers (name, whatsapp, city, origin, notes) values
    ('Bruno Lima (exemplo)', '5547999990002', 'Guaramirim', 'site', 'Registro de exemplo') returning id into c_bruno;
  insert into public.customers (name, whatsapp, instagram, city, origin, notes) values
    ('Carla Mendes (exemplo)', '5547999990003', 'carla.exemplo', 'Joinville', 'indicacao', 'Registro de exemplo') returning id into c_carla;
  insert into public.customers (name, whatsapp, city, origin, notes) values
    ('Diego Rocha (exemplo)', '5547999990004', 'Jaraguá do Sul', 'feira', 'Registro de exemplo') returning id into c_diego;

  insert into public.filaments (material, brand, color_name, color_hex, price_paid, initial_weight_g, remaining_g, notes) values
    ('PLA', 'Marca A (exemplo)', 'Preto', '#1d1f22', 99.90, 1000, 640, 'Registro de exemplo') returning id into f_preto;
  insert into public.filaments (material, brand, color_name, color_hex, price_paid, initial_weight_g, remaining_g, notes) values
    ('PLA', 'Marca A (exemplo)', 'Branco', '#eceae4', 99.90, 1000, 150, 'Registro de exemplo') returning id into f_branco;
  insert into public.filaments (material, brand, color_name, color_hex, price_paid, initial_weight_g, remaining_g, notes) values
    ('PLA', 'Marca B (exemplo)', 'Vermelho', '#c8100f', 119.90, 1000, 820, 'Registro de exemplo') returning id into f_vermelho;
  insert into public.filaments (material, brand, color_name, color_hex, price_paid, initial_weight_g, remaining_g, min_stock_g, notes) values
    ('PETG', 'Marca B (exemplo)', 'Transparente', '#c9d6dc', 129.90, 1000, 90, 150, 'Registro de exemplo') returning id into f_petg;
  insert into public.filaments (material, brand, color_name, color_hex, price_paid, initial_weight_g, remaining_g, notes) values
    ('PLA', 'Marca A (exemplo)', 'Cinza', '#8a9099', 99.90, 1000, 910, 'Registro de exemplo') returning id into f_cinza;

  insert into public.catalog_items (name, category, description, grams, print_minutes, post_hours, filament_id, base_price) values
    ('Dragão articulado (exemplo)', 'colecionaveis', 'Peça de exemplo', 95, 330, 0.25, f_vermelho, 89.90) returning id into k_dragao;
  insert into public.catalog_items (name, category, description, grams, print_minutes, post_hours, filament_id) values
    ('Suporte de headset (exemplo)', 'utilidades', 'Peça de exemplo', 85, 270, 0, f_preto) returning id into k_suporte;
  insert into public.catalog_items (name, category, description, grams, print_minutes, post_hours, filament_id, base_price) values
    ('Chaveiro com nome (exemplo)', 'personalizadas', 'Peça de exemplo', 6, 25, 0, f_branco, 15) returning id into k_chaveiro;
  insert into public.catalog_items (name, category, description, grams, print_minutes, post_hours, filament_id) values
    ('Organizador de gaveta (exemplo)', 'tecnicas', 'Peça de exemplo', 140, 410, 0, f_cinza) returning id into k_organizador;

  -- 12 pedidos espalhados nos últimos meses
  for i in 1..12 loop
    st := sts[i];
    insert into public.orders (customer_id, status, due_date, delivery_method, delivery_fee, notes, created_at, delivered_at, payment_method)
    values (
      (array[c_ana, c_bruno, c_carla, c_diego])[1 + (i % 4)],
      st,
      (now() at time zone 'America/Sao_Paulo')::date + (i - 9),
      (array['retirada','motoboy','correios'])[1 + (i % 3)],
      case when i % 3 = 1 then 12 else 0 end,
      'Pedido de exemplo',
      now() - make_interval(days => (12 - i) * 14),
      case when st = 'entregue' then now() - make_interval(days => (12 - i) * 14 - 5) end,
      (array['pix','dinheiro','cartao'])[1 + (i % 3)]
    ) returning id into o;

    insert into public.order_items (order_id, position, catalog_item_id, description, category, filament_id, printer_id, grams, print_minutes, quantity, post_hours,
      material_cost, energy_cost, machine_cost, labor_cost, calculated_unit_price)
    values
      (o, 0, k_dragao, 'Dragão articulado (exemplo)', 'colecionaveis', f_vermelho, printer, 95, 330, 1 + (i % 2), 0.25, 11.39, 0.78, 6.60, 7.50, 89.90),
      (o, 1, case when i % 2 = 0 then k_suporte else k_organizador end,
          case when i % 2 = 0 then 'Suporte de headset (exemplo)' else 'Organizador de gaveta (exemplo)' end,
          case when i % 2 = 0 then 'utilidades' else 'tecnicas' end,
          case when i % 2 = 0 then f_preto else f_cinza end, printer,
          case when i % 2 = 0 then 85 else 140 end, case when i % 2 = 0 then 270 else 410 end, 1, 0,
          case when i % 2 = 0 then 8.49 else 13.99 end, case when i % 2 = 0 then 0.64 else 0.97 end, case when i % 2 = 0 then 5.40 else 8.20 end, 0,
          case when i % 2 = 0 then 59.90 else 89.90 end);
    if i % 3 = 0 then
      insert into public.order_items (order_id, position, catalog_item_id, description, category, filament_id, printer_id, grams, print_minutes, quantity,
        material_cost, energy_cost, machine_cost, calculated_unit_price, override_unit_price)
      values (o, 2, k_chaveiro, 'Chaveiro com nome (exemplo)', 'personalizadas', f_branco, printer, 6, 25, 4, 0.60, 0.06, 0.50, 2.90, 15);
    end if;

    -- sinal de 50% em todos; os entregues estão quitados
    insert into public.payments (order_id, amount, method, kind, paid_at)
    select o, round(total / 2, 2), 'pix', 'sinal', (created_at at time zone 'America/Sao_Paulo')::date from public.orders where id = o;
    if st = 'entregue' then
      insert into public.payments (order_id, amount, method, kind, paid_at)
      select o, total - paid_total, 'pix', 'restante', (delivered_at at time zone 'America/Sao_Paulo')::date from public.orders where id = o;
    end if;

    -- placas: concluídas nos pedidos que já passaram da impressão
    if st in ('entregue', 'pronto', 'pos_processamento') then
      insert into public.print_jobs (order_id, printer_id, filament_id, title, grams, print_minutes, status, started_at, finished_at, deducted_g)
      select o, printer, filament_id, description, grams * quantity, print_minutes * quantity, 'concluida',
             (select created_at from public.orders where id = o) + interval '1 day',
             (select created_at from public.orders where id = o) + interval '1 day' + make_interval(mins => print_minutes * quantity),
             grams * quantity
        from public.order_items where order_id = o;
    elsif st = 'imprimindo' then
      insert into public.print_jobs (order_id, printer_id, filament_id, title, grams, print_minutes, status, started_at, position)
      select o, printer, filament_id, description, grams * quantity, print_minutes * quantity,
             case when position = 0 then 'imprimindo' else 'na_fila' end,
             case when position = 0 then now() - interval '95 minutes' end, position
        from public.order_items where order_id = o;
    elsif st = 'na_fila' then
      insert into public.print_jobs (order_id, printer_id, filament_id, title, grams, print_minutes, position)
      select o, printer, filament_id, description, grams * quantity, print_minutes * quantity, 10 + position
        from public.order_items where order_id = o;
    end if;
  end loop;

  -- algumas falhas (o trigger desconta dos carretéis)
  insert into public.failures (filament_id, grams_lost, minutes_lost, reason, occurred_at) values
    (f_vermelho, 18, 55, 'Descolou da mesa (exemplo)', now() - interval '40 days'),
    (f_preto, 9, 25, 'Entupiu o bico (exemplo)', now() - interval '12 days'),
    (f_cinza, 22, 80, 'Faltou suporte (exemplo)', now() - interval '3 days');

  -- um orçamento em aberto
  insert into public.quotes (customer_id, status, valid_until, notes) values
    (c_carla, 'enviado', (now() at time zone 'America/Sao_Paulo')::date + 5, 'Orçamento de exemplo') returning id into o;
  insert into public.quote_items (quote_id, catalog_item_id, description, category, filament_id, printer_id, grams, print_minutes, quantity,
    material_cost, energy_cost, machine_cost, calculated_unit_price)
  values (o, k_suporte, 'Suporte de headset (exemplo)', 'utilidades', f_preto, printer, 85, 270, 2, 8.49, 0.64, 5.40, 59.90);
end $$;
