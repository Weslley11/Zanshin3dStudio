-- Teste de RLS e do fluxo orçamento → pedido → fila. Roda dentro de uma
-- transação e desfaz tudo no fim (nada fica no banco):
--   DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run db:test
-- Cada coluna "ok_..." precisa sair "t"; qualquer erro interrompe o teste.
\set QUIET on
\pset footer off
begin;

-- dois usuários fictícios e nenhum dono, só dentro desta transação
\set dono '00000000-0000-4000-8000-0000000000d1'
\set intruso '00000000-0000-4000-8000-0000000000e2'
insert into auth.users (id, email, aud, role) values
  (:'dono', 'teste-dono@exemplo.invalid', 'authenticated', 'authenticated'),
  (:'intruso', 'teste-intruso@exemplo.invalid', 'authenticated', 'authenticated');
delete from public.app_owner;
-- impressora livre para o teste (o seed pode ter uma placa imprimindo)
update public.print_jobs set status = 'na_fila', started_at = null where status = 'imprimindo';

-- ------------------------------------------------------------ dono
select set_config('request.jwt.claims', json_build_object('sub', :'dono', 'role', 'authenticated')::text, true) \gset
set local role authenticated;
select public.claim_ownership() as ok_dono_virou_dono;

insert into public.customers (name, whatsapp) values ('Cliente Teste', '5547999990000') returning id as cid \gset
insert into public.filaments (material, brand, color_name, price_paid, initial_weight_g, remaining_g)
values ('PLA', 'Marca', 'Preto', 100, 1000, 1000) returning id as fid \gset
select public.save_quote(
  json_build_object('customer_id', :'cid', 'delivery_fee', 0)::jsonb,
  json_build_array(json_build_object('description', 'Peça', 'filament_id', :'fid', 'grams', 50, 'print_minutes', 120, 'quantity', 2, 'calculated_unit_price', 39.90))::jsonb
) as qid \gset
select total = 79.80 as ok_total_orcamento from public.quotes where id = :'qid';

select public.convert_quote_to_order(:'qid') as oid \gset
select status = 'aprovado' as ok_orcamento_aprovado from public.quotes where id = :'qid';
update public.orders set status = 'na_fila' where id = :'oid';
select count(*) = 1 and sum(grams) = 100 as ok_placa_criada from public.print_jobs where order_id = :'oid';
select id as jid from public.print_jobs where order_id = :'oid' \gset

select public.start_print_job(:'jid') \gset
select status = 'imprimindo' as ok_pedido_imprimindo from public.orders where id = :'oid';
select public.fail_print_job(:'jid', 20, 30, 'descolou') \gset
select remaining_g = 980 as ok_falha_desconta from public.filaments where id = :'fid';
select status = 'na_fila' as ok_placa_volta_fila from public.print_jobs where id = :'jid';
select public.start_print_job(:'jid') \gset
select public.complete_print_job(:'jid') \gset
select remaining_g = 880 as ok_conclusao_desconta from public.filaments where id = :'fid';
select status = 'pos_processamento' as ok_pedido_pos from public.orders where id = :'oid';

insert into public.payments (order_id, amount, method) values (:'oid', 30, 'pix');
select paid_total = 30 and total - paid_total = 49.80 as ok_restante from public.orders where id = :'oid';
select string_agg(to_status, '>' order by created_at) = 'aprovado>na_fila>imprimindo>pos_processamento' as ok_historico
  from public.order_events where order_id = :'oid';
update public.orders set status = 'pronto' where id = :'oid';
select public_token as tok from public.orders where id = :'oid' \gset

-- dois orçamentos para o link: um válido e um vencido
select public.save_quote(
  json_build_object('customer_id', :'cid', 'valid_until', (public.today_sp() + 5)::text, 'internal_notes', 'segredo interno')::jsonb,
  json_build_array(json_build_object('description', 'Chaveiro', 'grams', 5, 'print_minutes', 20, 'quantity', 1,
    'material_cost', 0.5, 'calculated_unit_price', 15))::jsonb
) as qid2 \gset
select public.save_quote(
  json_build_object('customer_id', :'cid', 'valid_until', (public.today_sp() - 1)::text)::jsonb,
  json_build_array(json_build_object('description', 'Vaso', 'grams', 50, 'print_minutes', 90, 'quantity', 1, 'calculated_unit_price', 40))::jsonb
) as qid3 \gset
select public_token as qtok2 from public.quotes where id = :'qid2' \gset
select public_token as qtok3 from public.quotes where id = :'qid3' \gset
select set_config('teste.qtok3', :'qtok3', true) \gset

-- ------------------------------------------------------------ intruso
reset role;
select set_config('request.jwt.claims', json_build_object('sub', :'intruso', 'role', 'authenticated')::text, true) \gset
set local role authenticated;
select not public.claim_ownership() as ok_intruso_nao_vira_dono;
select (select count(*) from public.orders) = 0 and (select count(*) from public.settings) = 0 as ok_intruso_nao_ve_nada;

-- ------------------------------------------------------------ anônimo
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true) \gset
set local role anon;
select (select count(*) from public.orders) = 0 and (select count(*) from public.customers) = 0
   and (select count(*) from public.models) = 0 as ok_anon_nao_ve_tabelas;
select count(*) = 0 as ok_anon_nao_lista_arquivos_3d from storage.objects where bucket_id = 'models';
select (r ->> 'number') is not null
   and r -> 'items' -> 0 ->> 'description' = 'Peça'
   and not (r ? 'total') and not (r ? 'customer') and not (r::text ilike '%Cliente Teste%')
   as ok_rastreio_sem_valores_nem_cliente
  from (select public.public_order_tracking(:'tok') as r) x;
select public.public_order_tracking('token-que-nao-existe-1234') is null as ok_token_invalido;

-- orçamento pelo link: vê preços, nunca custos nem anotação interna
select (r ->> 'number') is not null and (r -> 'items' -> 0 ->> 'unit_price')::numeric = 15
   and r::text not ilike '%material_cost%' and r::text not ilike '%segredo interno%' and r::text not ilike '%params%'
   and r ->> 'customer_first_name' = 'Cliente'
   as ok_link_mostra_precos_sem_custos
  from (select public.public_quote(:'qtok2') as r) x;
select public.public_quote_seen(:'qtok2') \gset
-- vencido não aprova
do $$
begin
  perform public.public_approve_quote(current_setting('teste.qtok3'));
  raise exception 'deveria ter recusado';
exception when others then
  if sqlerrm not like 'Este orçamento venceu%' then raise; end if;
end $$;
select (public.public_quote(:'qtok3') ->> 'expired')::boolean as ok_link_vencido_marcado;
-- válido aprova e cria o pedido; aprovar de novo não duplica
select public.public_approve_quote(:'qtok2') ->> 'order_token' as otok \gset
select (public.public_approve_quote(:'qtok2') ->> 'already')::boolean and (public.public_approve_quote(:'qtok2') ->> 'order_token') = :'otok' as ok_aprovar_de_novo_nao_duplica;
select public.public_order_tracking(:'otok') ->> 'status' = 'aprovado' as ok_cliente_acompanha_pedido;

reset role;
select (select count(*) from public.orders where quote_id = :'qid2') = 1
   and (select approved_via from public.quotes where id = :'qid2') = 'cliente'
   and (select client_viewed_at is not null from public.quotes where id = :'qid2')
   and (select note from public.order_events e join public.orders o on o.id = e.order_id where o.quote_id = :'qid2' and e.from_status is null) like 'Aprovado pelo cliente%'
   as ok_pedido_do_link_registrado;

rollback;
