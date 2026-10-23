import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FloppyDisk, Info } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/button'
import { DateInput, Field, NumberInput, Select, Textarea } from '@/components/ui/field'
import { Card } from '@/components/ui/misc'
import { AnimatedNumber } from '@/components/ui/motion'
import { ErrorState, ListSkeleton } from '@/components/ui/states'
import { CustomerPicker } from '@/features/customers/CustomerPicker'
import { fromRow, newItem, toRow, validate } from '@/features/quotes/draft'
import { ItemsEditorList, useItemsDraft } from '@/features/quotes/ItemsDraft'
import { DELIVERY, PAYMENT } from '@/lib/constants'
import { brl, docNumber } from '@/lib/format'
import { keys, must, useAction, useFilaments, usePrinters, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { useOrder, type OrderDetail } from './api'

/** /pedidos/novo (pedido direto, sem orçamento) e /pedidos/:id/itens (editar as peças). */
export function OrderEditorPage() {
  const { id } = useParams<{ id: string }>()
  const order = useOrder(id)
  const settings = useSettings()
  const printers = usePrinters()
  const filaments = useFilaments()
  const loading = settings.isPending || printers.isPending || filaments.isPending || (id && order.isPending)
  const error = settings.error || printers.error || filaments.error || order.error
  const back = <BackButton fallback={id ? `/pedidos/${id}` : '/pedidos'} />

  if (loading)
    return (
      <>
        <PageHeader back={back} title={id ? 'Editar itens' : 'Novo pedido'} />
        <Page>
          <ListSkeleton rows={2} height="h-72" />
        </Page>
      </>
    )
  if (error)
    return (
      <>
        <PageHeader back={back} title="Pedido" />
        <Page>
          <ErrorState error={error} onRetry={() => (order.refetch(), settings.refetch(), printers.refetch(), filaments.refetch())} />
        </Page>
      </>
    )
  return <Editor key={order.data?.updated_at ?? 'novo'} order={order.data ?? null} back={back} />
}

function Editor({ order, back }: { order: OrderDetail | null; back: React.ReactNode }) {
  const navigate = useNavigate()
  const draft = useItemsDraft(({ paramsFor, defaultPrinterId }) =>
    order?.items.length ? order.items.map(fromRow) : [newItem(paramsFor(defaultPrinterId, null), defaultPrinterId)],
  )
  const { items, markDirty } = draft
  const [customerId, setCustomerId] = useState<string | null>(order?.customer_id ?? null)
  const [deliveryFee, setDeliveryFee] = useState<number | null>(order ? Number(order.delivery_fee) : null)
  const [due, setDue] = useState<string | null>(null)
  const [delivery, setDelivery] = useState('')
  const [payment, setPayment] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const total = draft.itemsTotal + (deliveryFee ?? 0)
  const hasJobs = Boolean(order?.jobs.some((j) => j.status !== 'cancelada'))

  const save = useAction(
    async () =>
      must(
        await supabase.rpc('save_order', {
          p_order: order
            ? { id: order.id, customer_id: customerId ?? '', delivery_fee: deliveryFee ?? 0 }
            : { customer_id: customerId ?? '', delivery_fee: deliveryFee ?? 0, due_date: due ?? '', delivery_method: delivery, payment_method: payment, notes: notes.trim() },
          // o id do item existente vai junto para as placas da fila continuarem ligadas a ele
          p_items: items.map((it) => ({ ...toRow(it), id: order?.items.some((oi) => oi.id === it.key) ? it.key : '' })),
        }),
      ) as string,
    {
      invalidate: [keys.orders, keys.jobs, ['customers'], keys.finance],
      success: order ? 'Itens do pedido salvos' : 'Pedido criado',
      onSuccess: (id) => {
        draft.markSaved()
        navigate(`/pedidos/${id}`, { replace: true })
      },
    },
  )

  function submit() {
    const err = validate(items)
    setFormError(err)
    if (!err) save.mutate(undefined)
  }

  return (
    <>
      <PageHeader back={back} title={order ? `Itens do ${docNumber(order.number)}` : 'Novo pedido'} description={order?.customer?.name ?? (order ? undefined : 'Pedido direto, sem orçamento')} />
      <Page>
        {hasJobs && (
          <div role="status" className="mb-4 flex gap-3 rounded-ui border border-border bg-surface p-4 text-sm">
            <Info className="mt-0.5 size-5 shrink-0 text-fg-muted" />
            <span>Este pedido já tem placas na fila. Elas não mudam sozinhas: se trocar peças ou quantidades, ajuste as placas na fila.</span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <Card className="p-4 lg:hidden">
              <Field label="Cliente">{(p) => <CustomerPicker {...p} value={customerId} onChange={(v) => (markDirty(), setCustomerId(v))} />}</Field>
            </Card>
            <ItemsEditorList draft={draft} />
          </div>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <Card className="flex flex-col gap-4 p-4">
              <Field label="Cliente" className="hidden lg:flex">
                {(p) => <CustomerPicker {...p} value={customerId} onChange={(v) => (markDirty(), setCustomerId(v))} />}
              </Field>
              {!order && (
                <>
                  <Field label="Prazo de entrega" optional>
                    {(p) => <DateInput {...p} value={due} onValueChange={(v) => (markDirty(), setDue(v))} />}
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Entrega" optional>
                      {(p) => (
                        <Select {...p} value={delivery} onChange={(e) => (markDirty(), setDelivery(e.target.value))}>
                          <option value="">A definir</option>
                          {Object.entries(DELIVERY).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                    <Field label="Pagamento" optional>
                      {(p) => (
                        <Select {...p} value={payment} onChange={(e) => (markDirty(), setPayment(e.target.value))}>
                          <option value="">A definir</option>
                          {Object.entries(PAYMENT).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>
                </>
              )}
              <Field label="Taxa de entrega" optional>
                {(p) => <NumberInput {...p} prefix="R$" value={deliveryFee} onValueChange={(v) => (markDirty(), setDeliveryFee(v))} />}
              </Field>
              {!order && (
                <Field label="Observações" optional>
                  {(p) => <Textarea {...p} rows={3} value={notes} onChange={(e) => (markDirty(), setNotes(e.target.value))} />}
                </Field>
              )}
              <dl className="num flex flex-col gap-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-fg-muted">
                  <dt>Peças</dt>
                  <dd className="text-fg">{brl(draft.itemsTotal)}</dd>
                </div>
                {(deliveryFee ?? 0) > 0 && (
                  <div className="flex justify-between text-fg-muted">
                    <dt>Entrega</dt>
                    <dd className="text-fg">{brl(deliveryFee)}</dd>
                  </div>
                )}
                <div className="mt-1 flex items-baseline justify-between">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-2xl font-semibold">
                    <AnimatedNumber value={total} format={brl} />
                  </dd>
                </div>
                {order && Number(order.paid_total) > 0 && (
                  <div className="flex justify-between text-fg-muted">
                    <dt>Já pago</dt>
                    <dd className="text-fg">{brl(Number(order.paid_total))}</dd>
                  </div>
                )}
              </dl>
              {formError && (
                <p role="alert" className="text-sm text-danger">
                  {formError}
                </p>
              )}
              <Button variant="primary" size="lg" onClick={submit} loading={save.isPending} className="hidden lg:inline-flex">
                <FloppyDisk /> {order ? 'Salvar itens' : 'Criar pedido'}
              </Button>
            </Card>
          </aside>
        </div>
        <div className="h-20 lg:hidden" aria-hidden />
      </Page>

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-fg-subtle">Total</div>
            <div className="num text-lg leading-tight font-semibold">
              <AnimatedNumber value={total} format={brl} />
            </div>
          </div>
          <Button variant="primary" size="lg" onClick={submit} loading={save.isPending}>
            <FloppyDisk /> {order ? 'Salvar' : 'Criar pedido'}
          </Button>
        </div>
        {formError && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {formError}
          </p>
        )}
      </div>
    </>
  )
}
