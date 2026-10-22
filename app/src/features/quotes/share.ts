import { brl, date, docNumber } from '@/lib/format'
import type { Customer, Filament, Quote, QuoteItem } from '@/lib/types'

/** Texto pronto para colar no WhatsApp (negrito com *asteriscos*). */
export function quoteWhatsAppText({
  quote,
  items,
  customer,
  filaments,
  businessName,
}: {
  quote: Quote
  items: QuoteItem[]
  customer: Customer | null
  filaments: Filament[]
  businessName: string
}) {
  const first = customer?.name.trim().split(/\s+/)[0]
  const lines: string[] = []
  lines.push(`Olá${first ? `, ${first}` : ''}! Segue o orçamento *${docNumber(quote.number)}* da ${businessName}:`)
  lines.push('')
  for (const it of items) {
    const f = filaments.find((x) => x.id === it.filament_id)
    const mat = f ? ` (${f.material} ${f.color_name.toLowerCase()})` : ''
    const price = Number(it.unit_price)
    if (it.quantity > 1) {
      lines.push(`• ${it.quantity}x ${it.description}${mat}: ${brl(price)} cada, ${brl(Number(it.line_total))}`)
    } else {
      lines.push(`• ${it.description}${mat}: ${brl(price)}`)
    }
  }
  lines.push('')
  if (Number(quote.delivery_fee) > 0) {
    lines.push(`Entrega: ${brl(Number(quote.delivery_fee))}`)
  }
  lines.push(`*Total: ${brl(Number(quote.total))}*`)
  if (quote.valid_until) lines.push(`Válido até ${date(quote.valid_until)}.`)
  if (quote.notes?.trim()) {
    lines.push('')
    lines.push(quote.notes.trim())
  }
  lines.push('')
  lines.push('Para confirmar, é só responder esta mensagem.')
  return lines.join('\n')
}
