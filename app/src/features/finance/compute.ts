import type { Failure, Order, OrderItem, Payment, PrintJob } from '@/lib/types'

export type FinanceData = {
  orders: (Order & { items: OrderItem[]; customer: { name: string } | null })[]
  payments: Payment[]
  failures: (Failure & { filament: { cost_per_g: number | null } | null })[]
  jobs: Pick<PrintJob, 'grams' | 'print_minutes' | 'finished_at' | 'status'>[]
}

/** "2026-10" de um timestamp, no fuso de São Paulo */
export function monthOf(ts: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(new Date(ts)).slice(0, 7)
}

export function lastMonths(n: number, from = new Date()) {
  const cur = monthOf(from.toISOString())
  const [y, m] = cur.split('-').map(Number)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1))
    return d.toISOString().slice(0, 7)
  })
}

export type MonthSummary = ReturnType<typeof summarize>

/**
 * Resumo de um mês. Faturamento = pedidos aprovados no mês (sem cancelados).
 * Custo de material e de máquina vêm da cópia guardada em cada item; as falhas
 * entram pelo custo por grama do carretel. A mão de obra é sua, então fica no lucro.
 */
export function summarize(data: FinanceData, month: string) {
  const orders = data.orders.filter((o) => o.status !== 'cancelado' && monthOf(o.created_at) === month)
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0)
  let material = 0
  let machine = 0
  let labor = 0
  const pieces = new Map<string, { name: string; qty: number; revenue: number }>()
  const categories = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items) {
      material += Number(it.material_cost) * it.quantity
      machine += (Number(it.energy_cost) + Number(it.machine_cost)) * it.quantity
      labor += Number(it.labor_cost) * it.quantity
      const key = it.catalog_item_id ?? it.description.trim().toLowerCase()
      const p = pieces.get(key) ?? { name: it.description, qty: 0, revenue: 0 }
      p.qty += it.quantity
      p.revenue += Number(it.line_total)
      pieces.set(key, p)
      const cat = it.category ?? 'sem'
      categories.set(cat, (categories.get(cat) ?? 0) + Number(it.line_total))
    }
  }
  const failures = data.failures.filter((f) => monthOf(f.occurred_at) === month)
  const failureCost = failures.reduce((s, f) => s + Number(f.grams_lost) * Number(f.filament?.cost_per_g ?? 0), 0)
  const failureGrams = failures.reduce((s, f) => s + Number(f.grams_lost), 0)
  const printedGrams = data.jobs.filter((j) => j.status === 'concluida' && j.finished_at && monthOf(j.finished_at) === month).reduce((s, j) => s + Number(j.grams), 0)
  const received = data.payments.filter((p) => p.paid_at.slice(0, 7) === month).reduce((s, p) => s + Number(p.amount), 0)

  return {
    month,
    count: orders.length,
    revenue,
    received,
    material: material + failureCost,
    materialItems: material,
    failureCost,
    machine,
    labor,
    profit: revenue - material - failureCost - machine,
    ticket: orders.length ? revenue / orders.length : null,
    failureRate: failureRate(printedGrams, failureGrams),
    failureGrams,
    printedGrams,
    topPieces: [...pieces.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 6),
    categories: [...categories.entries()].map(([k, v]) => ({ key: k, revenue: v })).sort((a, b) => b.revenue - a.revenue),
    orders,
  }
}

/** Taxa de falha real: filamento perdido ÷ (impresso com sucesso + perdido). Sem impressão concluída, não há taxa. */
export function failureRate(printed: number, lost: number) {
  if (printed <= 0) return null
  return (lost / (printed + lost)) * 100
}

export function overallFailureRate(data: FinanceData) {
  const printed = data.jobs.filter((j) => j.status === 'concluida').reduce((s, j) => s + Number(j.grams), 0)
  const lost = data.failures.reduce((s, f) => s + Number(f.grams_lost), 0)
  return failureRate(printed, lost)
}

const csvNum = (n: number) => n.toFixed(2).replace('.', ',')
const csvText = (t: string) => `"${t.replace(/"/g, '""')}"`

/** CSV para Excel em português: ponto e vírgula, vírgula decimal e BOM UTF-8. */
export function monthCsv(s: MonthSummary, docNumber: (n: number) => string, date: (d: string) => string) {
  const head = ['Pedido', 'Data', 'Cliente', 'Status', 'Total', 'Pago', 'Material', 'Energia e máquina', 'Mão de obra', 'Lucro estimado']
  const rows = s.orders.map((o) => {
    const mat = o.items.reduce((a, it) => a + Number(it.material_cost) * it.quantity, 0)
    const mac = o.items.reduce((a, it) => a + (Number(it.energy_cost) + Number(it.machine_cost)) * it.quantity, 0)
    const lab = o.items.reduce((a, it) => a + Number(it.labor_cost) * it.quantity, 0)
    return [
      docNumber(o.number),
      date(o.created_at),
      csvText(o.customer?.name ?? ''),
      o.status,
      csvNum(Number(o.total)),
      csvNum(Number(o.paid_total)),
      csvNum(mat),
      csvNum(mac),
      csvNum(lab),
      csvNum(Number(o.total) - mat - mac),
    ].join(';')
  })
  const foot = [
    '',
    '',
    csvText('Perdas com falhas no mês'),
    '',
    '',
    '',
    csvNum(s.failureCost),
    '',
    '',
    csvNum(-s.failureCost),
  ].join(';')
  return '﻿' + [head.join(';'), ...rows, foot].join('\r\n')
}
