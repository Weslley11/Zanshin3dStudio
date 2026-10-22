import { describe, expect, it } from 'vitest'
import { failureRate, lastMonths, monthOf, summarize, type FinanceData } from './compute'

describe('finance', () => {
  it('mês no fuso de São Paulo', () => {
    // 01/11 01:00 UTC ainda é 31/10 em São Paulo
    expect(monthOf('2026-11-01T01:00:00Z')).toBe('2026-10')
  })
  it('últimos meses', () => {
    expect(lastMonths(3, new Date('2026-01-15T12:00:00Z'))).toEqual(['2025-11', '2025-12', '2026-01'])
  })
  it('taxa de falha real', () => {
    expect(failureRate(900, 100)).toBe(10)
    expect(failureRate(0, 0)).toBeNull()
    expect(failureRate(0, 30)).toBeNull()
  })
  it('resume faturamento, custos e lucro', () => {
    const item = { quantity: 2, material_cost: 5, energy_cost: 0.5, machine_cost: 1.5, labor_cost: 10, line_total: 60, description: 'Peça', catalog_item_id: null, category: 'utilidades' }
    const data = {
      orders: [
        { status: 'entregue', created_at: '2026-10-10T15:00:00Z', total: 70, items: [item] },
        { status: 'cancelado', created_at: '2026-10-11T15:00:00Z', total: 999, items: [item] },
      ],
      payments: [{ paid_at: '2026-10-10', amount: 35 }],
      failures: [{ occurred_at: '2026-10-12T15:00:00Z', grams_lost: 10, filament: { cost_per_g: 0.1 } }],
      jobs: [{ status: 'concluida', finished_at: '2026-10-12T18:00:00Z', grams: 90, print_minutes: 60 }],
    } as unknown as FinanceData
    const s = summarize(data, '2026-10')
    expect(s.count).toBe(1)
    expect(s.revenue).toBe(70)
    expect(s.material).toBeCloseTo(11) // 2 × 5 + 10 g × 0,10
    expect(s.machine).toBeCloseTo(4)
    expect(s.profit).toBeCloseTo(55)
    expect(s.received).toBe(35)
    expect(s.failureRate).toBeCloseTo(10)
  })
})
