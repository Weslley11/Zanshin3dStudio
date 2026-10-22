import { calculate, type Breakdown, type PricingParams } from '@/lib/pricing'
import type { CatalogItem, Extra, Filament, Printer, QuoteItem, Settings } from '@/lib/types'

/** Parâmetros usados no cálculo de um item (cópia gravada junto com ele). */
export type ItemParams = PricingParams

export type DraftItem = {
  key: string
  catalog_item_id: string | null
  description: string
  category: string | null
  filament_id: string | null
  printer_id: string | null
  grams: number | null
  print_minutes: number | null
  quantity: number
  post_hours: number | null
  extras: Extra[]
  urgent: boolean
  params: ItemParams
  override_unit_price: number | null
}

const num = (v: unknown) => (v == null || v === '' ? null : Number(v))

export function currentParams(settings: Settings | undefined, printer: Printer | undefined, filament: Filament | undefined): ItemParams {
  return {
    costPerG: filament ? num(filament.cost_per_g) : null,
    energyTariff: num(settings?.energy_tariff),
    powerKw: num(printer?.power_kw),
    wearPerHour: num(printer?.wear_per_hour),
    laborRate: num(settings?.labor_rate),
    failureRatePct: num(settings?.failure_rate_pct),
    marginPct: num(settings?.margin_pct),
    urgencyPct: num(settings?.urgency_pct),
    rounding: (settings?.rounding as '90' | '00' | null) ?? null,
  }
}

export function newItem(params: ItemParams, printerId: string | null, from?: Partial<DraftItem>): DraftItem {
  return {
    key: crypto.randomUUID(),
    catalog_item_id: null,
    description: '',
    category: null,
    filament_id: null,
    printer_id: printerId,
    grams: null,
    print_minutes: null,
    quantity: 1,
    post_hours: null,
    extras: [],
    urgent: false,
    params,
    override_unit_price: null,
    ...from,
  }
}

export function itemFromCatalog(c: CatalogItem, params: ItemParams, printerId: string | null): DraftItem {
  return newItem(params, printerId, {
    catalog_item_id: c.id,
    description: c.name,
    category: c.category,
    filament_id: c.filament_id,
    grams: num(c.grams),
    print_minutes: c.print_minutes,
    post_hours: num(c.post_hours),
    // preço base do catálogo entra como preço à mão; o calculado fica visível ao lado
    override_unit_price: num(c.base_price),
  })
}

/** O item foi calculado com parâmetros diferentes dos atuais? */
export function paramsOutdated(item: DraftItem, current: ItemParams) {
  const keys = Object.keys(current) as (keyof ItemParams)[]
  return keys.some((k) => (item.params[k] ?? null) !== (current[k] ?? null))
}

export function compute(item: DraftItem): Breakdown {
  return calculate(
    {
      grams: item.grams ?? 0,
      printMinutes: item.print_minutes ?? 0,
      postHours: item.post_hours ?? 0,
      extras: item.extras,
      urgent: item.urgent,
    },
    item.params,
  )
}

export function unitPrice(item: DraftItem, b = compute(item)) {
  return item.override_unit_price ?? b.unitPrice
}

/** Linha para a função save_quote (e para order_items). */
export function toRow(item: DraftItem) {
  const b = compute(item)
  return {
    catalog_item_id: item.catalog_item_id,
    description: item.description.trim(),
    category: item.category,
    filament_id: item.filament_id,
    printer_id: item.printer_id,
    grams: item.grams ?? 0,
    print_minutes: item.print_minutes ?? 0,
    quantity: item.quantity,
    post_hours: item.post_hours ?? 0,
    extras: item.extras.filter((e) => e.label.trim() || e.amount),
    urgent: item.urgent,
    params: item.params,
    material_cost: round4(b.material),
    energy_cost: round4(b.energy),
    machine_cost: round4(b.machine),
    labor_cost: round4(b.labor),
    extras_total: round4(b.extras),
    calculated_unit_price: b.unitPrice ?? 0,
    override_unit_price: item.override_unit_price,
  }
}

const round4 = (n: number) => Math.round(n * 10000) / 10000

export function fromRow(r: QuoteItem): DraftItem {
  const p = (r.params ?? {}) as Partial<ItemParams>
  return {
    key: r.id,
    catalog_item_id: r.catalog_item_id,
    description: r.description,
    category: r.category,
    filament_id: r.filament_id,
    printer_id: r.printer_id,
    grams: num(r.grams),
    print_minutes: r.print_minutes,
    quantity: r.quantity,
    post_hours: num(r.post_hours),
    extras: Array.isArray(r.extras) ? (r.extras as Extra[]) : [],
    urgent: r.urgent,
    params: {
      costPerG: num(p.costPerG),
      energyTariff: num(p.energyTariff),
      powerKw: num(p.powerKw),
      wearPerHour: num(p.wearPerHour),
      laborRate: num(p.laborRate),
      failureRatePct: num(p.failureRatePct),
      marginPct: num(p.marginPct),
      urgencyPct: num(p.urgencyPct),
      rounding: (p.rounding as '90' | '00' | null) ?? null,
    },
    override_unit_price: num(r.override_unit_price),
  }
}

/** Problemas que impedem salvar. */
export function validate(items: DraftItem[]): string | null {
  if (!items.length) return 'Adicione pelo menos uma peça.'
  for (const [i, it] of items.entries()) {
    const n = `Peça ${i + 1}`
    if (!it.description.trim()) return `${n}: dê um nome para a peça.`
    if (it.quantity < 1) return `${n}: quantidade mínima é 1.`
    if (unitPrice(it) == null) return `${n}: sem preço. Preencha o que falta ou digite o preço à mão.`
  }
  return null
}
