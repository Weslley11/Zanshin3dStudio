import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartLineUp, DownloadSimple } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { Card, Stat } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { CATEGORIES } from '@/lib/constants'
import { brl, date, docNumber, grams, monthLabel, percent } from '@/lib/format'
import { keys, must, useAction, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { lastMonths, monthCsv, overallFailureRate, summarize, type FinanceData, type MonthSummary } from './compute'

function useFinance() {
  return useQuery({
    queryKey: keys.finance,
    queryFn: async () => {
      const since = `${lastMonths(12)[0]}-01T00:00:00-03:00`
      const [o, p, f, j] = await Promise.all([
        supabase.from('orders').select('*, items:order_items(*), customer:customers(name)').gte('created_at', since).order('created_at'),
        supabase.from('payments').select('*').gte('paid_at', since.slice(0, 10)),
        supabase.from('failures').select('*, filament:filaments(cost_per_g)').gte('occurred_at', since),
        supabase.from('print_jobs').select('grams, print_minutes, finished_at, status').eq('status', 'concluida').gte('finished_at', since),
      ])
      return { orders: must(o), payments: must(p), failures: must(f), jobs: must(j) } as unknown as FinanceData
    },
  })
}

export function FinancePage() {
  const finance = useFinance()
  const months = useMemo(() => lastMonths(12), [])
  const [month, setMonth] = useState(months[months.length - 1])

  const summaries = useMemo(() => (finance.data ? months.map((m) => summarize(finance.data!, m)) : []), [finance.data, months])
  const s = summaries.find((x) => x.month === month)
  const prev = summaries[summaries.findIndex((x) => x.month === month) - 1]

  function exportCsv() {
    if (!s) return
    const blob = new Blob([monthCsv(s, docNumber, date)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `zanshin-financeiro-${month}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Faturamento, custos e lucro estimado por mês."
        actions={
          <Button onClick={exportCsv} disabled={!s?.count}>
            <DownloadSimple /> <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        }
      />
      <Page>
        {finance.isPending ? (
          <ListSkeleton rows={3} height="h-40" />
        ) : finance.error ? (
          <ErrorState error={finance.error} onRetry={() => finance.refetch()} />
        ) : !finance.data.orders.length ? (
          <EmptyState icon={<ChartLineUp />} title="Ainda sem números">
            O financeiro se monta sozinho com os pedidos aprovados, os pagamentos e as falhas registradas.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="mes" className="sr-only">
                Mês
              </label>
              <Select id="mes" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto min-w-52">
                {[...months].reverse().map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </Select>
            </div>

            <Headline s={s!} prev={prev} />

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <RevenueChart summaries={summaries} month={month} onSelect={setMonth} />
              <FailureCard s={s!} data={finance.data} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <TopPieces s={s!} />
              <Categories s={s!} />
            </div>
          </div>
        )}
      </Page>
    </>
  )
}

function delta(cur: number, prev: number | undefined) {
  if (!prev) return null
  const d = ((cur - prev) / prev) * 100
  return `${d >= 0 ? '+' : ''}${d.toFixed(0)}% vs mês anterior`
}

function Headline({ s, prev }: { s: MonthSummary; prev?: MonthSummary }) {
  const margin = s.revenue ? (s.profit / s.revenue) * 100 : null
  return (
    <Card className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
        <span className="text-xs font-medium tracking-wide text-fg-subtle uppercase">Faturamento</span>
        <span className="num text-4xl font-semibold tracking-tight">{brl(s.revenue)}</span>
        <span className="num text-xs text-fg-muted">
          {s.count} {s.count === 1 ? 'pedido' : 'pedidos'}
          {delta(s.revenue, prev?.revenue) && ` · ${delta(s.revenue, prev?.revenue)}`}
        </span>
      </div>
      <Stat label="Lucro estimado" value={brl(s.profit)} hint={margin != null ? `${percent(margin, 0)} do faturamento` : undefined} />
      <Stat label="Ticket médio" value={s.ticket == null ? '--' : brl(s.ticket)} />
      <Stat label="Recebido no mês" value={brl(s.received)} hint="Pagamentos registrados" />
      <dl className="num grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:col-span-2 lg:col-span-4 lg:grid-cols-4">
        <div>
          <dt className="text-fg-subtle">Material</dt>
          <dd className="font-medium">{brl(s.materialItems)}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Energia e máquina</dt>
          <dd className="font-medium">{brl(s.machine)}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Perdas com falhas</dt>
          <dd className="font-medium">{brl(s.failureCost)}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Sua mão de obra</dt>
          <dd className="font-medium">{brl(s.labor)}</dd>
          <dd className="text-xs text-fg-subtle">já incluída no lucro</dd>
        </div>
      </dl>
    </Card>
  )
}

/** Uma série só (faturamento por mês): barras finas, o mês escolhido em vermelho. */
function RevenueChart({ summaries, month, onSelect }: { summaries: MonthSummary[]; month: string; onSelect: (m: string) => void }) {
  const data = summaries.slice(-6)
  const max = Math.max(...data.map((d) => d.revenue), 1)
  const [hover, setHover] = useState<string | null>(null)
  const [table, setTable] = useState(false)
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Faturamento nos últimos 6 meses</h2>
        <Button variant="ghost" size="sm" onClick={() => setTable((t) => !t)} aria-pressed={table}>
          {table ? 'Ver gráfico' : 'Ver tabela'}
        </Button>
      </div>
      {table ? (
        <table className="num w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-fg-subtle">
              <th className="pb-2 font-medium">Mês</th>
              <th className="pb-2 text-right font-medium">Faturamento</th>
              <th className="pb-2 text-right font-medium">Pedidos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((d) => (
              <tr key={d.month}>
                <td className="py-1.5">{monthLabel(d.month)}</td>
                <td className="py-1.5 text-right">{brl(d.revenue)}</td>
                <td className="py-1.5 text-right">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          {/* grade recessiva */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t border-dashed border-border" />
            ))}
          </div>
          <ul className="relative flex h-48 items-end gap-3" aria-label="Faturamento por mês">
            {data.map((d) => {
              const h = (d.revenue / max) * 100
              const active = d.month === month
              return (
                <li key={d.month} className="flex h-full flex-1 flex-col items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onSelect(d.month)}
                    onMouseEnter={() => setHover(d.month)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(d.month)}
                    onBlur={() => setHover(null)}
                    aria-label={`${monthLabel(d.month)}: ${brl(d.revenue)}`}
                    aria-pressed={active}
                    className="group relative flex h-[calc(100%-1.75rem)] w-full items-end justify-center"
                  >
                    {hover === d.month && (
                      <span className="num absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-ui border border-border bg-surface-2 px-2 py-1 text-xs whitespace-nowrap shadow-[var(--shadow)]">
                        {brl(d.revenue)} · {d.count} ped.
                      </span>
                    )}
                    <span
                      className={cn('w-full max-w-10 rounded-t-[4px] transition-[height,background-color] duration-300', active ? 'bg-accent' : 'bg-silver/45 group-hover:bg-silver/70')}
                      style={{ height: `${Math.max(h, d.revenue ? 2 : 0)}%` }}
                    />
                  </button>
                  <span className={cn('mt-2 h-5 text-xs capitalize', active ? 'font-medium text-fg' : 'text-fg-subtle')}>
                    {monthLabel(d.month).slice(0, 3).toLowerCase()}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="absolute inset-x-0 bottom-7 border-t border-border-strong" aria-hidden />
        </div>
      )}
    </Card>
  )
}

function FailureCard({ s, data }: { s: MonthSummary; data: FinanceData }) {
  const settings = useSettings().data
  const overall = overallFailureRate(data)
  const configured = settings?.failure_rate_pct != null ? Number(settings.failure_rate_pct) : null
  const apply = useAction(
    async (v: number) => must(await supabase.from('settings').update({ failure_rate_pct: Math.round(v * 10) / 10 }).eq('id', 1)),
    { invalidate: [keys.settings], success: 'Taxa de falha atualizada nas configurações' },
  )
  return (
    <Card className="flex flex-col p-4">
      <h2 className="text-sm font-semibold">Taxa de falha real</h2>
      <p className="mt-1 text-xs text-fg-muted">Filamento perdido em falhas sobre o total impresso.</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Stat
          label="No mês"
          value={s.failureRate == null ? '--' : percent(s.failureRate)}
          hint={s.printedGrams > 0 ? `${grams(s.failureGrams)} perdidos de ${grams(s.printedGrams + s.failureGrams)}` : 'Nenhuma placa concluída no mês'}
        />
        <Stat label="Últimos 12 meses" value={overall == null ? '--' : percent(overall)} />
      </div>
      <div className="mt-auto border-t border-border pt-3 text-sm">
        <p className="text-fg-muted">
          Usada nos orçamentos: <span className="num font-medium text-fg">{configured == null ? 'não definida' : percent(configured)}</span>
        </p>
        {overall != null && (configured == null || Math.abs(overall - configured) >= 0.5) && (
          <Button size="sm" className="mt-2" onClick={() => apply.mutate(overall)} loading={apply.isPending}>
            Usar {percent(overall)} nos orçamentos
          </Button>
        )}
      </div>
    </Card>
  )
}

function TopPieces({ s }: { s: MonthSummary }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Peças que mais vendem</h2>
      {!s.topPieces.length ? (
        <p className="text-sm text-fg-muted">Nenhuma venda neste mês.</p>
      ) : (
        <table className="num w-full table-fixed text-sm">
          <thead>
            <tr className="text-left text-xs text-fg-subtle">
              <th className="pb-2 font-medium">Peça</th>
              <th className="w-12 pb-2 text-right font-medium">Qtd.</th>
              <th className="w-28 pb-2 text-right font-medium">Vendido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {s.topPieces.map((p) => (
              <tr key={p.name}>
                <td className="truncate py-2 pr-2" title={p.name}>{p.name}</td>
                <td className="py-2 text-right text-fg-muted">{p.qty}</td>
                <td className="py-2 text-right font-medium">{brl(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function Categories({ s }: { s: MonthSummary }) {
  const max = Math.max(...s.categories.map((c) => c.revenue), 1)
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Vendas por categoria</h2>
      {!s.categories.length ? (
        <p className="text-sm text-fg-muted">Nenhuma venda neste mês.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {s.categories.map((c) => (
            <li key={c.key}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="truncate">{CATEGORIES[c.key] ?? 'Sem categoria'}</span>
                <span className="num font-medium">{brl(c.revenue)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-3" aria-hidden>
                <div className="h-full rounded-full bg-silver/70" style={{ width: `${(c.revenue / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
