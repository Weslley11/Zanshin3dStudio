import { describe, expect, it } from 'vitest'
import { calculate, roundPrice, type PricingParams } from './pricing'

const params: PricingParams = {
  costPerG: 0.1,
  energyTariff: 1,
  powerKw: 0.2,
  wearPerHour: 1,
  laborRate: 20,
  failureRatePct: 10,
  marginPct: 100,
  urgencyPct: 20,
  rounding: '90',
}

describe('roundPrice', () => {
  it('arredonda para cima no final ,90', () => {
    expect(roundPrice(37.2, '90')).toBe(37.9)
    expect(roundPrice(37.9, '90')).toBe(37.9)
    expect(roundPrice(37.95, '90')).toBe(38.9)
    expect(roundPrice(0.1, '90')).toBe(0.9)
  })
  it('arredonda para cima no final ,00', () => {
    expect(roundPrice(37.01, '00')).toBe(38)
    expect(roundPrice(37, '00')).toBe(37)
  })
})

describe('calculate', () => {
  it('segue a fórmula do estúdio', () => {
    const r = calculate({ grams: 100, printMinutes: 300, postHours: 1, extras: [{ label: 'Ímã', amount: 2 }], urgent: false }, params)
    expect(r.material).toBeCloseTo(10)
    expect(r.energy).toBeCloseTo(1) // 5 h × 0,2 kW × R$ 1
    expect(r.machine).toBeCloseTo(5)
    expect(r.labor).toBeCloseTo(20)
    expect(r.cost).toBeCloseTo(36)
    // 36 × 1,1 × 2 + 2 = 81,2 → 81,90
    expect(r.raw).toBeCloseTo(81.2)
    expect(r.unitPrice).toBe(81.9)
    expect(r.missing).toEqual([])
  })
  it('aplica urgência antes dos extras', () => {
    const r = calculate({ grams: 100, printMinutes: 300, postHours: 1, extras: [{ label: 'Ímã', amount: 2 }], urgent: true }, params)
    // 79,2 × 1,2 + 2 = 97,04 → 97,90
    expect(r.unitPrice).toBe(97.9)
  })
  it('não inventa valores: lista o que falta e não dá preço', () => {
    const empty: PricingParams = { ...params, energyTariff: null, marginPct: null, laborRate: null }
    const r = calculate({ grams: 10, printMinutes: 60, postHours: 0, extras: [], urgent: false }, empty)
    expect(r.unitPrice).toBeNull()
    expect(r.missing).toEqual(['tarifa de energia', 'margem'])
  })
})
