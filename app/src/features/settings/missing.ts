import type { Printer, Settings } from '@/lib/types'

/** O que ainda falta preencher para a calculadora dar preço. */
export function missingSettings(s: Settings | undefined, printers: Printer[] | undefined): string[] {
  if (!s) return []
  const out: string[] = []
  if (s.energy_tariff == null) out.push('tarifa de energia')
  if (s.failure_rate_pct == null) out.push('taxa de falha')
  if (s.margin_pct == null) out.push('margem')
  if (s.rounding == null) out.push('arredondamento')
  if (s.labor_rate == null) out.push('valor da hora de pós-processamento')
  const printer = printers?.find((p) => p.id === s.default_printer_id) ?? printers?.[0]
  if (!printer) out.push('impressora')
  else {
    if (printer.power_kw == null) out.push(`potência da ${printer.name}`)
    if (printer.wear_per_hour == null) out.push(`desgaste da ${printer.name}`)
  }
  return out
}
