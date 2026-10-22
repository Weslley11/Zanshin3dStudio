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
