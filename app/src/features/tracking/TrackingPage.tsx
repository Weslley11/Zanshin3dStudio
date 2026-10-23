import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy, InstagramLogo, LinkBreak, Package, Truck, WhatsappLogo } from '@phosphor-icons/react'
import { toast } from 'sonner'
import logoDark from '@/assets/logo-horizontal-dark-bg.png'
import logoLight from '@/assets/logo-horizontal-light-bg.png'
import { Button } from '@/components/ui/button'
import { Card, Skeleton } from '@/components/ui/misc'
import { PrintStage } from '@/components/print/PrintStage'
import { ErrorState } from '@/components/ui/states'
import { DELIVERY, ORDER_STATUSES, ORDER_STATUS_PUBLIC, type OrderStatus } from '@/lib/constants'
import { date, dateTime } from '@/lib/format'
import { photoUrl, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { igLink, waLink } from '@/lib/whatsapp'

/** O que a função pública devolve: nada de valores, custos ou dados do cliente. */
type Tracking = {
  number: string
  status: OrderStatus
  created_at: string
  due_date: string | null
  delivery_method: string | null
  tracking_code: string | null
  items: { description: string; quantity: number }[]
  events: { status: OrderStatus; at: string }[]
  photos: string[]
  business: { name: string; whatsapp: string | null; instagram: string | null }
}

export function TrackingPage() {
  const { token } = useParams<{ token: string }>()
  const q = useQuery({
    queryKey: ['tracking', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_order_tracking', { p_token: token! })
      if (error) throw error
      return data as unknown as Tracking | null
    },
    refetchInterval: 120_000,
  })

  useEffect(() => {
    document.title = q.data ? `Pedido ${q.data.number} · Zanshin 3D Studio` : 'Acompanhe seu pedido · Zanshin 3D Studio'
  }, [q.data])

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-xl items-center px-4 py-4">
          <img src={logoDark} alt="Zanshin 3D Studio" className="hidden h-9 w-auto dark:block" />
          <img src={logoLight} alt="Zanshin 3D Studio" className="h-9 w-auto dark:hidden" />
        </div>
      </header>
      <main className="animate-enter mx-auto flex max-w-xl flex-col gap-4 px-4 py-6">
        {q.isPending ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-72" />
          </>
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data ? (
          <Card className="flex flex-col items-center px-6 py-10 text-center">
            <LinkBreak className="mb-3 size-9 text-fg-subtle" />
            <h1 className="text-lg font-semibold">Link não encontrado</h1>
            <p className="mt-1 max-w-xs text-sm text-fg-muted">Confira se o link foi copiado inteiro. Se continuar assim, fale com a gente pelo WhatsApp.</p>
            <Button asChild variant="primary" className="mt-5">
              <a href={waLink('5547991677070', 'Olá! Não consegui abrir o link de acompanhamento do meu pedido.')} target="_blank" rel="noreferrer">
                <WhatsappLogo /> Falar no WhatsApp
              </a>
            </Button>
          </Card>
        ) : (
          <TrackingView t={q.data} />
        )}
      </main>
    </div>
  )
}

function TrackingView({ t }: { t: Tracking }) {
  const cancelled = t.status === 'cancelado'
  const idx = ORDER_STATUSES.indexOf(t.status as (typeof ORDER_STATUSES)[number])
  // data em que cada etapa foi alcançada (a última vez que entrou nela)
  const reached = new Map<string, string>()
  for (const e of t.events) reached.set(e.status, e.at)
  const ready = t.status === 'pronto' || t.status === 'entregue'

  return (
    <>
      <Card className="p-5">
        <p className="text-sm text-fg-muted">Pedido</p>
        <h1 className="title-display num text-3xl">{t.number}</h1>
        <p className={cn('mt-3 text-lg font-medium', cancelled ? 'text-fg-muted' : '')} style={cancelled ? undefined : { color: `var(--st-${t.status})` }}>
          {ORDER_STATUS_PUBLIC[t.status]}
        </p>
        {t.due_date && !cancelled && t.status !== 'entregue' && (
          <p className="num mt-1 text-sm text-fg-muted">
            Previsão de entrega: <span className="font-medium text-fg">{date(t.due_date)}</span>
          </p>
        )}
      </Card>

      {t.status === 'imprimindo' && (
        <Card className="overflow-hidden">
          <PrintStage framing="card" sceneClassName="print-fade-card" className="h-56" />
          <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">Cada peça sai da impressora camada por camada. A sua está sendo impressa agora.</p>
        </Card>
      )}

      {ready && t.photos.length > 0 && (
        <Card className="overflow-hidden">
          <div className={cn('grid gap-0.5', t.photos.length > 1 && 'grid-cols-2')}>
            {t.photos.map((p) => (
              <a key={p} href={photoUrl(p)!} target="_blank" rel="noreferrer">
                <img src={photoUrl(p)!} alt={`Foto do pedido ${t.number} pronto`} className="aspect-square w-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
          <p className="px-4 py-3 text-sm text-fg-muted">Sua peça pronta.</p>
        </Card>
      )}

      {!cancelled && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Andamento</h2>
          <ol className="flex flex-col">
            {ORDER_STATUSES.map((s, i) => {
              const done = i <= idx
              const current = i === idx
              return (
                <li key={s} className="relative flex gap-3 pb-5 last:pb-0" aria-current={current ? 'step' : undefined}>
                  {i < ORDER_STATUSES.length - 1 && (
                    <span className={cn('absolute top-6 bottom-0 left-[11px] w-0.5', i < idx ? '' : 'bg-border')} style={i < idx ? { background: `var(--st-${t.status})` } : undefined} aria-hidden />
                  )}
                  <span
                    className={cn('relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2', done ? 'border-transparent text-bg' : 'border-border-strong bg-surface')}
                    style={done ? { background: `var(--st-${t.status})` } : undefined}
                  >
                    {done && <Check weight="bold" className="size-3.5" />}
                  </span>
                  <div className="-mt-0.5">
                    <p className={cn('text-[15px]', current ? 'font-semibold' : done ? 'text-fg' : 'text-fg-subtle')}>{ORDER_STATUS_PUBLIC[s]}</p>
                    {done && reached.get(s) && <p className="num text-xs text-fg-muted">{dateTime(reached.get(s)!)}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Package className="size-4 text-fg-muted" /> Itens
        </h2>
        <ul className="flex flex-col gap-2">
          {t.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[15px]">
              <span className="num w-8 shrink-0 text-fg-muted">{it.quantity}x</span>
              <span>{it.description}</span>
            </li>
          ))}
        </ul>
        {t.delivery_method && (
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <p className="flex items-center gap-2 text-fg-muted">
              <Truck className="size-4" /> Entrega: <span className="text-fg">{DELIVERY[t.delivery_method]}</span>
            </p>
            {t.tracking_code && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-fg-muted">Rastreio:</span>
                <span className="font-mono text-fg">{t.tracking_code}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copiar código de rastreio"
                  onClick={async () => {
                    await navigator.clipboard.writeText(t.tracking_code!)
                    toast.success('Código copiado')
                  }}
                >
                  <Copy />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="primary" size="lg" className="sm:flex-1">
          <a href={waLink(t.business.whatsapp, `Olá! Tenho uma dúvida sobre o pedido ${t.number}.`)} target="_blank" rel="noreferrer">
            <WhatsappLogo /> Falar no WhatsApp
          </a>
        </Button>
        {t.business.instagram && (
          <Button asChild variant="secondary" size="lg">
            <a href={igLink(t.business.instagram)!} target="_blank" rel="noreferrer">
              <InstagramLogo /> @{t.business.instagram}
            </a>
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-fg-subtle">
        {t.business.name} · impressão 3D sob encomenda · pedido feito em {date(t.created_at)}
      </p>
    </>
  )
}
