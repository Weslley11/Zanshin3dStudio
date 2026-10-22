import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { InstagramLogo, PencilSimple, Plus, Trash, WhatsappLogo } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Badge, Card, Stat, StatusBadge } from '@/components/ui/misc'
import { ErrorState, ListSkeleton } from '@/components/ui/states'
import { ORIGINS, QUOTE_STATUS_LABEL, type OrderStatus } from '@/lib/constants'
import { brl, date, docNumber, formatPhone } from '@/lib/format'
import { keys, must, useAction } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/lib/types'
import { igLink, waLink } from '@/lib/whatsapp'
import { CustomerDialog } from './CustomerDialog'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const q = useQuery({
    queryKey: keys.customer(id!),
    queryFn: async () => {
      const [c, o, qu] = await Promise.all([
        supabase.from('customers').select('*').eq('id', id!).single(),
        supabase.from('orders').select('id, number, status, total, created_at, due_date').eq('customer_id', id!).order('created_at', { ascending: false }),
        supabase.from('quotes').select('id, number, status, total, created_at').eq('customer_id', id!).order('created_at', { ascending: false }),
      ])
      return { customer: must(c) as Customer, orders: must(o) ?? [], quotes: must(qu) ?? [] }
    },
  })

  const remove = useAction(async () => must(await supabase.from('customers').delete().eq('id', id!)), {
    invalidate: [keys.customers],
    success: 'Cliente excluído',
    onSuccess: () => navigate('/clientes', { replace: true }),
  })

  const c = q.data?.customer
  const active = q.data?.orders.filter((o) => o.status !== 'cancelado') ?? []
  const spent = active.reduce((s, o) => s + Number(o.total), 0)

  return (
    <>
      <PageHeader
        back={<BackButton fallback="/clientes" />}
        title={c?.name ?? 'Cliente'}
        actions={
          c && (
            <Button variant="ghost" size="icon" aria-label="Editar cliente" onClick={() => setEditing(true)}>
              <PencilSimple />
            </Button>
          )
        }
      />
      <Page className="flex flex-col gap-4">
        {q.isPending ? (
          <ListSkeleton rows={3} height="h-28" />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : (
          <>
            <Card className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                {c!.origin && <Badge>{ORIGINS[c!.origin]}</Badge>}
                {c!.city && <span>{c!.city}</span>}
                <span>Cliente desde {date(c!.created_at)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {c!.whatsapp && (
                  <Button asChild variant="secondary">
                    <a href={waLink(c!.whatsapp)} target="_blank" rel="noreferrer">
                      <WhatsappLogo /> {formatPhone(c!.whatsapp)}
                    </a>
                  </Button>
                )}
                {c!.instagram && (
                  <Button asChild variant="secondary">
                    <a href={igLink(c!.instagram)!} target="_blank" rel="noreferrer">
                      <InstagramLogo /> @{c!.instagram}
                    </a>
                  </Button>
                )}
                <Button asChild variant="primary">
                  <Link to={`/orcamentos/novo?cliente=${c!.id}`}>
                    <Plus /> Novo orçamento
                  </Link>
                </Button>
              </div>
              {c!.notes && <p className="text-sm whitespace-pre-line text-fg-muted">{c!.notes}</p>}
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
                <Stat label="Total gasto" value={brl(spent)} />
                <Stat label="Pedidos" value={active.length} />
                <Stat label="Ticket médio" value={active.length ? brl(spent / active.length) : '--'} />
              </div>
            </Card>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-fg-muted">Pedidos</h2>
              {!q.data!.orders.length ? (
                <p className="rounded-ui border border-dashed border-border-strong px-4 py-6 text-center text-sm text-fg-muted">
                  Nenhum pedido ainda.
                </p>
              ) : (
                <Card className="divide-y divide-border">
                  {q.data!.orders.map((o) => (
                    <Link key={o.id} to={`/pedidos/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                      <span className="num w-20 text-sm font-medium">{docNumber(o.number)}</span>
                      <StatusBadge status={o.status as OrderStatus} />
                      <span className="num ml-auto text-sm text-fg-muted">{date(o.created_at)}</span>
                      <span className="num w-24 text-right text-sm font-medium">{brl(Number(o.total))}</span>
                    </Link>
                  ))}
                </Card>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-fg-muted">Orçamentos</h2>
              {!q.data!.quotes.length ? (
                <p className="rounded-ui border border-dashed border-border-strong px-4 py-6 text-center text-sm text-fg-muted">
                  Nenhum orçamento ainda.
                </p>
              ) : (
                <Card className="divide-y divide-border">
                  {q.data!.quotes.map((o) => (
                    <Link key={o.id} to={`/orcamentos/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                      <span className="num w-20 text-sm font-medium">{docNumber(o.number)}</span>
                      <Badge>{QUOTE_STATUS_LABEL[o.status]}</Badge>
                      <span className="num ml-auto text-sm text-fg-muted">{date(o.created_at)}</span>
                      <span className="num w-24 text-right text-sm font-medium">{brl(Number(o.total))}</span>
                    </Link>
                  ))}
                </Card>
              )}
            </section>

            <div>
              <Button variant="danger" size="sm" onClick={() => setDeleting(true)}>
                <Trash /> Excluir cliente
              </Button>
            </div>
          </>
        )}
      </Page>
      {editing && c && <CustomerDialog customer={c} onClose={() => setEditing(false)} onSaved={() => q.refetch()} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Excluir cliente?"
        description="Os pedidos e orçamentos continuam no sistema, mas sem cliente vinculado."
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
      />
    </>
  )
}
