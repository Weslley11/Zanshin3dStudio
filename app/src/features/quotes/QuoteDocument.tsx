import { forwardRef } from 'react'
import logo from '@/assets/logo-horizontal-light-bg.png'
import { brl, date, docNumber, formatPhone } from '@/lib/format'
import type { Customer, Filament, Quote, QuoteItem, Settings } from '@/lib/types'

/**
 * Orçamento com a marca, para virar imagem ou PDF. Cores fixas (fundo claro)
 * para sair igual em qualquer tema e imprimir bem.
 */
export const QuoteDocument = forwardRef<
  HTMLDivElement,
  { quote: Quote; items: QuoteItem[]; customer: Customer | null; filaments: Filament[]; settings: Settings }
>(function QuoteDocument({ quote, items, customer, filaments, settings }, ref) {
  const c = {
    ink: '#16191d',
    muted: '#555d68',
    line: '#d9dde3',
    soft: '#f1f3f5',
    red: '#c8100f',
    paper: '#fbfbfc',
  }
  return (
    <div
      ref={ref}
      style={{ width: 760, background: c.paper, color: c.ink, fontFamily: "'Geist Variable', system-ui, sans-serif", padding: 48, boxSizing: 'border-box' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `3px solid ${c.red}`, paddingBottom: 20 }}>
        <img src={logo} alt={settings.business_name} style={{ height: 56, width: 'auto' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.muted }}>Orçamento</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{docNumber(quote.number)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 24, fontSize: 14 }}>
        <div>
          <div style={{ color: c.muted, fontSize: 12, marginBottom: 2 }}>Para</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{customer?.name ?? 'Cliente'}</div>
          {customer?.city && <div style={{ color: c.muted }}>{customer.city}</div>}
        </div>
        <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          <div>
            <span style={{ color: c.muted }}>Emitido em </span>
            {date(quote.created_at)}
          </div>
          {quote.valid_until && (
            <div>
              <span style={{ color: c.muted }}>Válido até </span>
              <strong>{date(quote.valid_until)}</strong>
            </div>
          )}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 28, fontSize: 14 }}>
        <thead>
          <tr style={{ color: c.muted, fontSize: 12, textAlign: 'left' }}>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>Peça</th>
            <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'center', width: 60 }}>Qtd.</th>
            <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right', width: 110 }}>Unitário</th>
            <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right', width: 120 }}>Total</th>
          </tr>
        </thead>
        <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
          {items.map((it) => {
            const f = filaments.find((x) => x.id === it.filament_id)
            return (
              <tr key={it.id} style={{ borderTop: `1px solid ${c.line}` }}>
                <td style={{ padding: '12px 12px 12px 0' }}>
                  <div style={{ fontWeight: 600 }}>{it.description}</div>
                  {f && (
                    <div style={{ color: c.muted, fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 99, background: f.color_hex, border: `1px solid ${c.line}` }} />
                      {f.material} {f.color_name.toLowerCase()}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                <td style={{ textAlign: 'right' }}>{brl(Number(it.unit_price))}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{brl(Number(it.line_total))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 8, borderTop: `1px solid ${c.line}`, paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
        {Number(quote.delivery_fee) > 0 && (
          <>
            <div>
              <span style={{ color: c.muted }}>Peças </span>
              {brl(Number(quote.items_total))}
            </div>
            <div>
              <span style={{ color: c.muted }}>Entrega </span>
              {brl(Number(quote.delivery_fee))}
            </div>
          </>
        )}
        <div style={{ marginTop: 6, background: c.soft, padding: '10px 16px', borderRadius: 10, fontSize: 20, fontWeight: 700 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: c.muted, marginRight: 10 }}>Total</span>
          {brl(Number(quote.total))}
        </div>
      </div>

      {quote.notes?.trim() && (
        <div style={{ marginTop: 28, fontSize: 13, color: c.ink, whiteSpace: 'pre-line', lineHeight: 1.55 }}>
          <div style={{ color: c.muted, fontSize: 12, marginBottom: 4 }}>Observações</div>
          {quote.notes.trim()}
        </div>
      )}

      <div style={{ marginTop: 36, paddingTop: 16, borderTop: `1px solid ${c.line}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.muted }}>
        <span>{settings.business_name} · impressão 3D sob encomenda</span>
        <span>
          {settings.business_whatsapp && `WhatsApp ${formatPhone(settings.business_whatsapp)}`}
          {settings.business_instagram && ` · @${settings.business_instagram}`}
        </span>
      </div>
    </div>
  )
})
