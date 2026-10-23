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
