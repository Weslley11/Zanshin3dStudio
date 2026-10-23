import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Calculator, CalendarCheck, CheckCircle, CloudArrowDown, Disc, Plus, Printer, Queue, Warning } from '@phosphor-icons/react'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card, ColorSwatch, StatusBadge } from '@/components/ui/misc'
import { ErrorState, ListSkeleton } from '@/components/ui/states'
import { DueChip } from '@/features/orders/DueChip'
import { dueInfo } from '@/features/orders/due'
import { schedule } from '@/features/queue/schedule'
import { missingSettings } from '@/features/settings/missing'
import { monthOf } from '@/features/finance/compute'
import { useNow } from '@/hooks/useNow'
import { AnimatedNumber, FadeIn, ProgressFill } from '@/components/ui/motion'
import { PrintStage } from '@/components/print/PrintStage'
import { jobProgress, pieceFor } from '@/components/print/timeline'
import { TIMEZONE, type OrderStatus } from '@/lib/constants'
import { brl, daysUntil, docNumber, duration, grams, relativeDateTime, todayISO, toISODate } from '@/lib/format'
import { isLowStock, lowStockLimit, must, useFilaments, usePrinters, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { PrintJob } from '@/lib/types'

type JobRow = PrintJob & { order: { id: string; number: number; customer: { name: string } | null } | null; filament: { color_hex: string | null } | null }

function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const monthStart = `${todayISO().slice(0, 7)}-01T00:00:00-03:00`
      const [open, month, jobs, quotes, allOrders, byClient] = await Promise.all([
        supabase
          .from('orders')
          .select('id, number, status, due_date, total, paid_total, customer:customers(name)')
          .not('status', 'in', '(entregue,cancelado)')
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('orders').select('total, created_at, status').gte('created_at', monthStart).neq('status', 'cancelado'),
        supabase
          .from('print_jobs')
          .select('*, order:orders(id, number, customer:customers(name)), filament:filaments(color_hex)')
          .in('status', ['na_fila', 'imprimindo'])
          .order('position'),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).in('status', ['rascunho', 'enviado']),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        // aprovados pelo cliente no link nos últimos 7 dias
        supabase
          .from('quotes')
          .select('number, approved_at, customer:customers(name), order:orders(id, status)')
          .eq('approved_via', 'cliente')
          .gte('approved_at', new Date(Date.now() - 7 * 86_400_000).toISOString())
          .order('approved_at', { ascending: false }),
      ])
      return {
        open: must(open) as unknown as { id: string; number: number; status: string; due_date: string | null; total: number; paid_total: number; customer: { name: string } | null }[],
        month: (must(month) ?? []).filter((o) => monthOf(o.created_at) === todayISO().slice(0, 7)),
        jobs: must(jobs) as unknown as JobRow[],
        openQuotes: quotes.count ?? 0,
        ordersCount: allOrders.count ?? 0,
        // a tabela ainda pode não ter a coluna se a atualização do banco não foi aplicada
        approvedByClient: byClient.error
          ? []
          : ((byClient.data ?? []) as unknown as { number: number; approved_at: string; customer: { name: string } | null; order: { id: string; status: string }[] | { id: string; status: string } | null }[])
              .map((q) => ({ ...q, order: Array.isArray(q.order) ? q.order[0] : q.order }))
              .filter((q) => q.order?.status === 'aprovado'),
      }
    },
    refetchInterval: 60_000,
    staleTime: 0,
  })
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export function HomePage() {
  const home = useHome()
  const settings = useSettings()
  const printers = usePrinters()
  const now = useNow()
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' })
  const missing = missingSettings(settings.data, printers.data)

  return (
    <Page className="pt-[max(1rem,env(safe-area-inset-top))] lg:pt-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-fg-muted first-letter:uppercase">{today}</p>
          <h1 className="title-display text-2xl lg:text-3xl">{greeting()}</h1>
        </div>
        <Button asChild variant="primary">
          <Link to="/orcamentos/novo">
            <Plus /> Novo orçamento
          </Link>
        </Button>
      </header>

      {missing.length > 0 && !settings.isPending && (
        <Link to="/configuracoes" className="mb-4 flex items-center gap-3 rounded-ui border border-accent/40 bg-accent-soft p-4 text-sm hover:border-accent/70">
          <Warning className="size-5 shrink-0 text-accent-text" weight="fill" />
          <span className="flex-1">
            <span className="font-medium">Primeiro acesso?</span> Preencha os parâmetros de preço para a calculadora funcionar: {missing.join(', ')}.
          </span>
          <ArrowRight className="size-4" />
        </Link>
      )}

      {home.data?.approvedByClient.map((q) => (
        <FadeIn key={q.number} className="mb-3">
          <Link
            to={`/pedidos/${q.order!.id}`}
            className="flex items-center gap-3 rounded-ui border border-[color-mix(in_srgb,var(--ok)_40%,var(--border))] bg-surface p-4 text-sm hover:border-[var(--ok)]"
          >
            <CheckCircle className="size-5 shrink-0 text-ok" weight="fill" />
            <span className="flex-1">
              <span className="font-medium">{q.customer?.name ?? 'Cliente'} aprovou o orçamento {docNumber(q.number)}</span>
              <span className="block text-fg-muted">Pelo link, {relativeDateTime(new Date(q.approved_at)).toLowerCase()}. Toque para ver o pedido e mandar para a fila.</span>
            </span>
            <ArrowRight className="size-4" />
          </Link>
        </FadeIn>
      ))}
      {home.data && home.data.ordersCount > 0 && settings.data && <BackupReminder last={settings.data.last_backup_at} />}

      {home.isPending ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <ListSkeleton rows={3} height="h-24" />
          <ListSkeleton rows={2} height="h-32" />
        </div>
      ) : home.error ? (
        <ErrorState error={home.error} onRetry={() => home.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <FadeIn index={0}>
              <PrinterNow jobs={home.data.jobs} now={now} printerName={printers.data?.find((p) => p.id === settings.data?.default_printer_id)?.name ?? 'Impressora'} />
            </FadeIn>
            <FadeIn index={2}>
              <Deadlines orders={home.data.open} />
            </FadeIn>
          </div>
          <div className="flex flex-col gap-4">
            <FadeIn index={1}>
              <MonthRevenue orders={home.data.month} openQuotes={home.data.openQuotes} />
            </FadeIn>
            <FadeIn index={3}>
              <LowStock />
            </FadeIn>
          </div>
        </div>
      )}
    </Page>
  )

}

function LowStock() {
  const settings = useSettings()
  const filaments = useFilaments()
  const low = (filaments.data ?? []).filter((f) => isLowStock(f, settings.data))
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Disc className="size-4 text-fg-muted" /> Estoque baixo
        </h2>
        <Link to="/filamentos" className="text-xs text-fg-muted hover:text-fg">
          Filamentos
        </Link>
      </div>
      {!low.length ? (
        <p className="text-sm text-fg-muted">{filaments.data?.length ? 'Todos os carretéis acima do mínimo.' : 'Nenhum carretel cadastrado ainda.'}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {low.map((f) => (
            <li key={f.id} className="flex items-center gap-3">
              <ColorSwatch hex={f.color_hex} />
              <span className="min-w-0 flex-1 truncate text-sm">
                {f.material} {f.color_name} <span className="text-fg-subtle">· {f.brand}</span>
              </span>
              <span className="num text-sm font-medium text-accent-text">{grams(Number(f.remaining_g))}</span>
              <span className="num hidden text-xs text-fg-subtle sm:inline">mín. {grams(lowStockLimit(f, settings.data))}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function PrinterNow({ jobs, now, printerName }: { jobs: JobRow[]; now: number; printerName: string }) {
  const running = jobs.find((j) => j.status === 'imprimindo')
  const queued = jobs.filter((j) => j.status === 'na_fila')
  const plan = schedule(running, queued, now)
  const c = plan.current
  const pct = c ? Math.min(100, ((now - c.startAt) / (c.print_minutes * 60_000 || 1)) * 100) : 0

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Printer className="size-4 text-fg-muted" /> {printerName}
        </h2>
        <Link to="/fila" className="text-xs text-fg-muted hover:text-fg">
          Abrir fila
        </Link>
      </div>
      {c ? (
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="min-w-0 p-4">
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--st-imprimindo)' }}>
              <span className="size-2 animate-pulse rounded-full" style={{ background: 'var(--st-imprimindo)' }} /> Imprimindo agora
            </div>
            <p className="mt-1 text-lg font-semibold">{c.title}</p>
            {c.order && (
              <Link to={`/pedidos/${c.order.id}`} className="num text-sm text-fg-muted hover:underline">
                {docNumber(c.order.number)} · {c.order.customer?.name ?? 'Sem cliente'}
              </Link>
            )}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <ProgressFill pct={pct} className="h-full rounded-full" style={{ background: 'var(--st-imprimindo)' }} />
            </div>
            <p className="num mt-1.5 text-xs text-fg-muted">
              {Math.round(pct)}% · termina {relativeDateTime(new Date(c.endAt)).toLowerCase()}
            </p>
          </div>
          <PrintStage
            progress={jobProgress(c.startAt, c.print_minutes, now)}
            piece={pieceFor(c.id)}
            color={c.filament?.color_hex}
            sceneClassName="print-fade-card"
            className="border-l border-border"
          />
        </div>
      ) : (
        <p className="flex items-center gap-2 p-4 text-sm text-fg-muted">
          <Queue className="size-5 text-fg-subtle" />
          {queued.length ? 'Parada. A próxima placa espera você iniciar.' : 'Livre. Nada na fila.'}
        </p>
      )}
      {plan.queue.length > 0 && (
        <div className="border-t border-border bg-surface-2/40 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-fg-subtle">Próximos da fila</p>
          <ol className="flex flex-col gap-1.5">
            {plan.queue.slice(0, 3).map((j) => (
              <li key={j.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{j.title}</span>
                <span className="num text-xs text-fg-muted">{duration(j.print_minutes)}</span>
                <span className="num w-28 text-right text-xs text-fg-subtle">{relativeDateTime(new Date(j.endAt))}</span>
              </li>
            ))}
          </ol>
          {plan.queue.length > 3 && <p className="mt-1.5 text-xs text-fg-subtle">e mais {plan.queue.length - 3}</p>}
        </div>
      )}
    </Card>
  )
}

function Deadlines({ orders }: { orders: { id: string; number: number; status: string; due_date: string | null; customer: { name: string } | null }[] }) {
  const urgent = orders
    .map((o) => ({ o, info: dueInfo(o.due_date, o.status) }))
    .filter((x) => x.info && x.info.days <= 3)
    .sort((a, b) => a.info!.days - b.info!.days)
  const late = urgent.filter((x) => x.info!.tone === 'late').length

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarCheck className="size-4 text-fg-muted" /> Prazos
          {late > 0 && <span className="num rounded-ui bg-accent px-1.5 text-xs text-accent-fg">{late} atrasado{late > 1 ? 's' : ''}</span>}
        </h2>
        <Link to="/pedidos" className="text-xs text-fg-muted hover:text-fg">
          Pedidos
        </Link>
      </div>
      {!urgent.length ? (
        <p className="text-sm text-fg-muted">
          {orders.length ? `Nada atrasado nem vencendo nos próximos 3 dias. ${orders.length} pedido${orders.length > 1 ? 's' : ''} em andamento.` : 'Nenhum pedido em andamento.'}
        </p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {urgent.map(({ o }) => (
            <li key={o.id}>
              <Link to={`/pedidos/${o.id}`} className="flex items-center gap-3 rounded-ui px-2 py-2 hover:bg-surface-2">
                <span className="num w-20 shrink-0 text-sm font-medium">{docNumber(o.number)}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">{o.customer?.name ?? 'Sem cliente'}</span>
                <StatusBadge status={o.status as OrderStatus} className="hidden sm:inline-flex" />
                <span className="w-32 text-right">
                  <DueChip due={o.due_date} status={o.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function MonthRevenue({ orders, openQuotes }: { orders: { total: number | null }[]; openQuotes: number }) {
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0)
  const month = new Date().toLocaleDateString('pt-BR', { timeZone: TIMEZONE, month: 'long' })
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-fg-subtle uppercase">Faturamento de {month}</p>
      <p className="num mt-1 text-3xl font-semibold tracking-tight">
        <AnimatedNumber value={revenue} format={brl} from0 />
      </p>
      <p className="num mt-1 text-sm text-fg-muted">
        {orders.length} {orders.length === 1 ? 'pedido aprovado' : 'pedidos aprovados'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/financeiro">Ver financeiro</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/orcamentos">
            <Calculator /> {openQuotes} orçamento{openQuotes === 1 ? '' : 's'} em aberto
          </Link>
        </Button>
      </div>
    </Card>
  )
}

/** Lembra do backup quando nunca foi feito ou já passou de 30 dias. */
function BackupReminder({ last }: { last: string | null }) {
  const days = last ? -daysUntil(toISODate(new Date(last))) : null
  if (days != null && days < 30) return null
  return (
    <Link to="/configuracoes#backup" className="mb-4 flex items-center gap-3 rounded-ui border border-border bg-surface p-4 text-sm hover:border-border-strong">
      <CloudArrowDown className="size-5 shrink-0 text-fg-muted" />
      <span className="flex-1">
        {days == null ? 'Você ainda não baixou nenhum backup dos dados.' : `Faz ${days} dias desde o último backup.`}{' '}
        <span className="text-fg-muted">Leva alguns segundos e protege o histórico do estúdio.</span>
      </span>
      <ArrowRight className="size-4" />
    </Link>
  )
}
