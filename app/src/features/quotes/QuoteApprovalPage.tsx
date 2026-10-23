import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, LinkBreak, WhatsappLogo } from '@phosphor-icons/react'
import { m } from 'motion/react'
import logoDark from '@/assets/logo-horizontal-dark-bg.png'
import logoLight from '@/assets/logo-horizontal-light-bg.png'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Card, ColorSwatch, Skeleton } from '@/components/ui/misc'
import { ErrorState } from '@/components/ui/states'
import { brl, date } from '@/lib/format'
import { spring } from '@/lib/motion'
import { errorMessage, supabase } from '@/lib/supabase'
import { waLink } from '@/lib/whatsapp'

/** O que a função pública devolve: preços sim, custos e margens nunca. */
type PublicQuote = {
  number: string
  status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado'
  expired: boolean
  valid_until: string | null
  created_at: string
  customer_first_name: string | null
  items: { description: string; quantity: number; unit_price: number; line_total: number; material: string | null; color_name: string | null; color_hex: string | null }[]
  items_total: number
  delivery_fee: number
  total: number
  notes: string | null
  order_token: string | null
  business: { name: string; whatsapp: string | null; instagram: string | null }
}

export function QuoteApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const q = useQuery({
    queryKey: ['public-quote', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_quote', { p_token: token! })
      if (error) throw error
      return data as unknown as PublicQuote | null
    },
  })

  // avisa o estúdio que o cliente abriu (só a primeira vez conta). O cliente do
  // Supabase só envia a chamada quando alguém espera a resposta, daí o then.
  useEffect(() => {
    if (token) supabase.rpc('public_quote_seen', { p_token: token }).then(() => {})
  }, [token])

  useEffect(() => {
    document.title = q.data ? `Orçamento ${q.data.number} · Zanshin 3D Studio` : 'Orçamento · Zanshin 3D Studio'
  }, [q.data])

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-xl items-center px-4 py-4">
          <img src={logoDark} alt="Zanshin 3D Studio" className="hidden h-9 w-auto dark:block" />
          <img src={logoLight} alt="Zanshin 3D Studio" className="h-9 w-auto dark:hidden" />
        </div>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6">
        {q.isPending ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-64" />
          </>
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data ? (
          <Card className="flex flex-col items-center px-6 py-10 text-center">
            <LinkBreak className="mb-3 size-9 text-fg-subtle" />
            <h1 className="text-lg font-semibold">Orçamento não encontrado</h1>
            <p className="mt-1 max-w-xs text-sm text-fg-muted">Confira se o link foi copiado inteiro, ou fale com a gente pelo WhatsApp.</p>
            <Button asChild variant="primary" className="mt-5">
              <a href={waLink('5547991677070', 'Olá! Não consegui abrir o link do meu orçamento.')} target="_blank" rel="noreferrer">
                <WhatsappLogo /> Falar no WhatsApp
              </a>
            </Button>
          </Card>
        ) : (
          <QuoteView quote={q.data} token={token!} onChange={() => q.refetch()} />
        )}
      </main>
    </div>
  )
}

function QuoteView({ quote, token, onChange }: { quote: PublicQuote; token: string; onChange: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderToken, setOrderToken] = useState<string | null>(quote.order_token)
  const approved = quote.status === 'aprovado' || Boolean(orderToken)
  const canApprove = !approved && !quote.expired && quote.status !== 'recusado'
  const wa = (text: string) => waLink(quote.business.whatsapp, text)

  async function approve() {
    setApproving(true)
    setError(null)
    const { data, error } = await supabase.rpc('public_approve_quote', { p_token: token })
    setApproving(false)
    setConfirm(false)
    if (error) {
      setError(errorMessage(error))
      onChange()
      return
    }
    setOrderToken((data as { order_token: string }).order_token)
  }

  return (
    <>
      <Card className="p-5">
        <p className="text-sm text-fg-muted">{quote.customer_first_name ? `Orçamento para ${quote.customer_first_name}` : 'Orçamento'}</p>
        <h1 className="title-display num text-3xl">{quote.number}</h1>
        <p className="num mt-2 text-sm text-fg-muted">
          Emitido em {date(quote.created_at)}
          {quote.valid_until && (
            <>
              {' '}
              · {quote.expired ? 'venceu em ' : 'válido até '}
              <span className={quote.expired ? 'font-medium text-warn' : 'font-medium text-fg'}>{date(quote.valid_until)}</span>
            </>
          )}
        </p>
      </Card>

      <Card className="p-5">
        <ul className="flex flex-col divide-y divide-border">
          {quote.items.map((it, i) => (
            <li key={i} className="flex gap-3 py-3 first:pt-0">
              <span className="num w-8 shrink-0 text-fg-muted">{it.quantity}x</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{it.description}</p>
                {it.material && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                    {it.color_hex && <ColorSwatch hex={it.color_hex} className="size-3" />}
                    {it.material} {it.color_name?.toLowerCase()}
                  </p>
                )}
              </div>
              <div className="num text-right">
                <p className="font-medium">{brl(Number(it.line_total))}</p>
                {it.quantity > 1 && <p className="text-xs text-fg-subtle">{brl(Number(it.unit_price))} cada</p>}
              </div>
            </li>
          ))}
        </ul>
        <dl className="num mt-2 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          {Number(quote.delivery_fee) > 0 && (
            <>
              <div className="flex justify-between text-fg-muted">
                <dt>Peças</dt>
                <dd className="text-fg">{brl(Number(quote.items_total))}</dd>
              </div>
              <div className="flex justify-between text-fg-muted">
                <dt>Entrega</dt>
                <dd className="text-fg">{brl(Number(quote.delivery_fee))}</dd>
              </div>
            </>
          )}
          <div className="mt-1 flex items-baseline justify-between">
            <dt className="font-medium">Total</dt>
            <dd className="text-2xl font-semibold">{brl(Number(quote.total))}</dd>
          </div>
        </dl>
        {quote.notes?.trim() && <p className="mt-4 rounded-ui bg-surface-2 p-3 text-sm whitespace-pre-line">{quote.notes.trim()}</p>}
      </Card>

      {approved ? (
        <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            <CheckCircle className="size-10 text-ok" weight="fill" />
            <h2 className="text-lg font-semibold">Orçamento aprovado</h2>
            <p className="text-sm text-fg-muted">Seu pedido já está com a gente. Acompanhe cada etapa pelo link abaixo.</p>
            {orderToken && (
              <Button asChild variant="primary" size="lg" className="mt-2">
                <Link to={`/acompanhar/${orderToken}`}>Acompanhar pedido</Link>
              </Button>
            )}
          </Card>
        </m.div>
      ) : quote.status === 'recusado' ? (
        <Card className="p-5 text-center text-sm text-fg-muted">Este orçamento foi encerrado. Se ainda tiver interesse, fale com a gente que montamos um novo.</Card>
      ) : quote.expired ? (
        <Card className="p-5 text-center text-sm text-fg-muted">Este orçamento venceu. Fale com a gente pelo WhatsApp para atualizar os valores.</Card>
      ) : null}

      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {canApprove && (
          <Button variant="primary" size="lg" onClick={() => setConfirm(true)}>
            <CheckCircle /> Aprovar orçamento
          </Button>
        )}
        <Button asChild variant={canApprove ? 'secondary' : 'primary'} size="lg">
          <a href={wa(`Olá! Sobre o orçamento ${quote.number}:`)} target="_blank" rel="noreferrer">
            <WhatsappLogo /> {canApprove ? 'Tirar dúvida no WhatsApp' : 'Falar no WhatsApp'}
          </a>
        </Button>
      </div>
      <p className="text-center text-xs text-fg-subtle">{quote.business.name} · impressão 3D sob encomenda</p>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Aprovar o orçamento?"
        description={`O pedido ${quote.number} entra na nossa fila de produção. Total de ${brl(Number(quote.total))}. Combinamos o pagamento pelo WhatsApp.`}
        confirmLabel="Aprovar"
        loading={approving}
        onConfirm={approve}
      />
    </>
  )
}
