import { daysUntil } from '@/lib/format'

export type DueTone = 'late' | 'soon' | 'ok'

/** Situação do prazo de um pedido ainda não entregue. */
export function dueInfo(due: string | null, status: string): { label: string; tone: DueTone; days: number } | null {
  if (!due || status === 'entregue' || status === 'cancelado') return null
  const d = daysUntil(due)
  if (d < 0) return { label: d === -1 ? 'Atrasado 1 dia' : `Atrasado ${-d} dias`, tone: 'late', days: d }
  if (d === 0) return { label: 'Entrega hoje', tone: 'soon', days: d }
  if (d === 1) return { label: 'Entrega amanhã', tone: 'soon', days: d }
  if (d <= 3) return { label: `Em ${d} dias`, tone: 'soon', days: d }
  return { label: `Em ${d} dias`, tone: 'ok', days: d }
}
