import type { Extra } from './types'

/**
 * Cálculo do preço de uma peça (por unidade):
 *   material   = gramas × custo por grama do carretel
 *   energia    = horas × potência média (kW) × tarifa (R$/kWh)
 *   máquina    = horas × desgaste (R$/h)
 *   mão de obra = horas de pós × valor da hora
 *   preço = soma × (1 + falha%) × (1 + margem%) [× (1 + urgência%)] + extras,
 *           arredondado para cima no final escolhido (,90 ou ,00)
 */
export type PricingParams = {
  costPerG: number | null
  energyTariff: number | null
  powerKw: number | null
  wearPerHour: number | null
  laborRate: number | null
  failureRatePct: number | null
  marginPct: number | null
  urgencyPct: number | null
  rounding: '90' | '00' | null
}

export type PieceInput = {
  grams: number
  printMinutes: number
  postHours: number
  extras: Extra[]
  urgent: boolean
}

export type Breakdown = {
  material: number
  energy: number
  machine: number
  labor: number
  extras: number
  cost: number
  failure: number
  margin: number
  urgency: number
  raw: number
  unitPrice: number | null
  missing: string[]
}

const LABELS: Record<keyof PricingParams, string> = {
  costPerG: 'carretel (custo por grama)',
  energyTariff: 'tarifa de energia',
  powerKw: 'potência da impressora',
  wearPerHour: 'desgaste da impressora',
  laborRate: 'valor da hora de pós-processamento',
  failureRatePct: 'taxa de falha',
  marginPct: 'margem',
  urgencyPct: 'acréscimo de urgência',
  rounding: 'arredondamento',
}

export function roundPrice(value: number, mode: '90' | '00'): number {
  const cents = Math.round(value * 100)
  if (mode === '00') return Math.ceil(cents / 100)
  // próximo valor terminado em ,90 que não fique abaixo do preço
  let target = Math.floor(cents / 100) * 100 + 90
  if (target < cents) target += 100
  return target / 100
}

export function calculate(input: PieceInput, p: PricingParams): Breakdown {
  const required: (keyof PricingParams)[] = [
    'costPerG',
    'energyTariff',
    'powerKw',
    'wearPerHour',
    'failureRatePct',
    'marginPct',
    'rounding',
  ]
  if (input.postHours > 0) required.push('laborRate')
  if (input.urgent) required.push('urgencyPct')
  const missing = required.filter((k) => p[k] == null).map((k) => LABELS[k])

  const hours = input.printMinutes / 60
  const material = input.grams * (p.costPerG ?? 0)
  const energy = hours * (p.powerKw ?? 0) * (p.energyTariff ?? 0)
  const machine = hours * (p.wearPerHour ?? 0)
  const labor = input.postHours * (p.laborRate ?? 0)
  const extras = input.extras.reduce((s, e) => s + (Number.isFinite(e.amount) ? e.amount : 0), 0)
  const cost = material + energy + machine + labor
  const withFailure = cost * (1 + (p.failureRatePct ?? 0) / 100)
  const withMargin = withFailure * (1 + (p.marginPct ?? 0) / 100)
  const withUrgency = input.urgent ? withMargin * (1 + (p.urgencyPct ?? 0) / 100) : withMargin
  const raw = withUrgency + extras

  return {
    material,
    energy,
    machine,
    labor,
    extras,
    cost,
    failure: withFailure - cost,
    margin: withMargin - withFailure,
    urgency: withUrgency - withMargin,
    raw,
    unitPrice: missing.length ? null : roundPrice(raw, p.rounding!),
    missing,
  }
}
