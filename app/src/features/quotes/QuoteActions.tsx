import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Copy, CopySimple, FilePdf, Image, Trash, WhatsappLogo, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Card } from '@/components/ui/misc'
import { docNumber } from '@/lib/format'
import { keys, must, useAction, useFilaments, useSettings } from '@/lib/queries'
import { errorMessage, supabase } from '@/lib/supabase'
import { waLink } from '@/lib/whatsapp'
import type { QuoteWithItems } from './api'
import { QuoteDocument } from './QuoteDocument'
import { downloadQuotePdf, shareQuoteImage } from './exportQuote'
import { quoteWhatsAppText } from './share'

export function QuoteActions({ quote, dirty }: { quote: QuoteWithItems; dirty: boolean }) {
  const navigate = useNavigate()
  const settings = useSettings().data!
  const filaments = useFilaments().data ?? []
  const docRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'img' | 'pdf' | null>(null)
  const [confirm, setConfirm] = useState<'approve' | 'delete' | null>(null)
  const name = `Orcamento ${docNumber(quote.number)}`
  const approved = quote.status === 'aprovado'

  const text = quoteWhatsAppText({ quote, items: quote.items, customer: quote.customer, filaments, businessName: settings.business_name })

  const setStatus = useAction(
    async (status: 'enviado' | 'recusado' | 'rascunho') =>
      must(await supabase.from('quotes').update({ status, sent_at: status === 'enviado' ? new Date().toISOString() : quote.sent_at }).eq('id', quote.id)),
    { invalidate: [['quotes']] },
  )
  const markSent = () => quote.status === 'rascunho' && setStatus.mutate('enviado')

  const approve = useAction(async () => must(await supabase.rpc('convert_quote_to_order', { p_quote_id: quote.id })) as string, {
    invalidate: [['quotes'], keys.orders, ['customers']],
    success: 'Pedido criado',
    onSuccess: (orderId) => navigate(`/pedidos/${orderId}`),
  })

  const duplicate = useAction(
    async () =>
      must(
        await supabase.rpc('save_quote', {
          p_quote: { customer_id: quote.customer_id ?? '', delivery_fee: quote.delivery_fee, notes: quote.notes ?? '', internal_notes: quote.internal_notes ?? '', valid_until: '' },
          p_items: quote.items.map(({ id: _i, quote_id: _q, unit_price: _u, line_total: _l, created_at: _c, ...rest }) => rest),
        }),
      ) as string,
    { invalidate: [['quotes']], success: 'Cópia criada', onSuccess: (id) => navigate(`/orcamentos/${id}`) },
  )

  const remove = useAction(async () => must(await supabase.from('quotes').delete().eq('id', quote.id)), {
    invalidate: [['quotes']],
    success: 'Orçamento excluído',
    onSuccess: () => navigate('/orcamentos', { replace: true }),
  })

  async function exportAs(kind: 'img' | 'pdf') {
    if (!docRef.current) return
    setExporting(kind)
    try {
      if (kind === 'img') await shareQuoteImage(docRef.current, name)
      else await downloadQuotePdf(docRef.current, name)
      markSent()
    } catch (e) {
      toast.error(`Não deu para gerar: ${errorMessage(e)}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold">Enviar para o cliente</h2>
      {dirty && <p className="text-xs text-warn">Salve as alterações antes de enviar.</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="secondary" className={dirty ? 'pointer-events-none opacity-50' : ''}>
          <a href={waLink(quote.customer?.whatsapp, text)} target="_blank" rel="noreferrer" onClick={markSent} aria-disabled={dirty}>
            <WhatsappLogo /> WhatsApp
          </a>
        </Button>
        <Button
          disabled={dirty}
          onClick={async () => {
            await navigator.clipboard.writeText(text)
            toast.success('Texto copiado')
            markSent()
          }}
        >
          <Copy /> Copiar texto
        </Button>
        <Button disabled={dirty} loading={exporting === 'img'} onClick={() => exportAs('img')}>
          <Image /> Imagem
        </Button>
        <Button disabled={dirty} loading={exporting === 'pdf'} onClick={() => exportAs('pdf')}>
          <FilePdf /> PDF
        </Button>
      </div>
      {!quote.customer?.whatsapp && <p className="text-xs text-fg-subtle">Cliente sem WhatsApp: o botão abre o WhatsApp para você escolher o contato.</p>}

      {!approved && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Button variant="primary" size="lg" disabled={dirty} onClick={() => setConfirm('approve')}>
            <CheckCircle /> Aprovado: criar pedido
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {quote.status === 'recusado' ? (
              <Button variant="ghost" size="sm" onClick={() => setStatus.mutate('rascunho')}>
                Reabrir
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setStatus.mutate('recusado')}>
                <XCircle /> Recusado
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setConfirm('delete')}>
              <Trash /> Excluir
            </Button>
          </div>
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={() => duplicate.mutate(undefined)} loading={duplicate.isPending}>
        <CopySimple /> Duplicar orçamento
      </Button>

      {/* documento fora da tela, usado para gerar imagem e PDF */}
      <div aria-hidden className="pointer-events-none fixed top-0 -left-[9999px]">
        <QuoteDocument ref={docRef} quote={quote} items={quote.items} customer={quote.customer} filaments={filaments} settings={settings} />
      </div>

      <ConfirmDialog
        open={confirm === 'approve'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Criar o pedido?"
        description={`O orçamento ${docNumber(quote.number)} vira o pedido ${docNumber(quote.number)}, com os mesmos itens e valores.`}
        confirmLabel="Criar pedido"
        loading={approve.isPending}
        onConfirm={() => approve.mutate(undefined)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Excluir orçamento?"
        description="Não dá para desfazer. O número não é reaproveitado."
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
      />
    </Card>
  )
}
