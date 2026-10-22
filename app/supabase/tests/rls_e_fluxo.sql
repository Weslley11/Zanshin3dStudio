-- Teste de RLS e do fluxo orçamento → pedido → fila. Roda dentro de uma
-- transação e desfaz tudo no fim:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -v dono=<uuid> -v intruso=<uuid> -f supabase/tests/rls_e_fluxo.sql
begin;

-- dono reivindica o app
select set_config('request.jwt.claims', json_build_object('sub', :'dono', 'role', 'authenticated')::text, true);
set local role authenticated;
select public.claim_ownership() as dono_virou_dono;

insert into public.customers (name, whatsapp) values ('Cliente Teste', '5547999990000');
insert into public.filaments (material, brand, color_name, price_paid, initial_weight_g, remaining_g)
values ('PLA', 'Marca', 'Preto', 100, 1000, 1000);
insert into public.quotes (customer_id) select id from public.customers limit 1;
insert into public.quote_items (quote_id, description, filament_id, grams, print_minutes, quantity, calculated_unit_price)
select q.id, 'Peça', f.id, 50, 120, 2, 39.90 from public.quotes q, public.filaments f;
select total as total_orcamento from public.quotes;

select public.convert_quote_to_order((select id from public.quotes)) is not null as virou_pedido;
update public.orders set status = 'na_fila';
select count(*) as placas_criadas, sum(grams) as gramas from public.print_jobs;
select public.start_print_job((select id from public.print_jobs limit 1));
select status as pedido_apos_iniciar from public.orders;
select public.fail_print_job((select id from public.print_jobs limit 1), 20, 30, 'descolou');
select remaining_g as carretel_apos_falha from public.filaments;
select public.complete_print_job((select id from public.print_jobs limit 1));
select remaining_g as carretel_apos_concluir, (select status from public.orders) as pedido from public.filaments;
insert into public.payments (order_id, amount, method) select id, 30, 'pix' from public.orders;
select total, paid_total, total - paid_total as restante from public.orders;
select string_agg(coalesce(from_status,'-') || '>' || to_status, ' ' order by created_at) as historico from public.order_events;
update public.orders set status = 'pronto';
select public_token as tok from public.orders \gset

-- intruso não vê nada e não vira dono
reset role;
select set_config('request.jwt.claims', json_build_object('sub', :'intruso', 'role', 'authenticated')::text, true);
set local role authenticated;
select public.claim_ownership() as intruso_virou_dono;
select (select count(*) from public.orders) as intruso_pedidos, (select count(*) from public.settings) as intruso_settings;

-- anônimo: nada nas tabelas, só a função pública
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select (select count(*) from public.orders) as anon_pedidos, (select count(*) from public.customers) as anon_clientes;
select public.public_order_tracking(:'tok') as rastreio;
select public.public_order_tracking('token-que-nao-existe-1234') as rastreio_invalido;
rollback;
