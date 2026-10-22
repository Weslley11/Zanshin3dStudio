import { useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Camera,
  CheckCircle,
  Copy,
  DotsThreeVertical,
  Eye,
  EyeSlash,
  LinkSimple,
  PencilSimple,
  Plus,
  Queue,
  Trash,
  WarningOctagon,
  WhatsappLogo,
  XCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { DateInput, DurationInput, Field, Input, NumberInput, Select, Textarea } from '@/components/ui/field'
import { Badge, Card, ColorSwatch, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, StatusBadge } from '@/components/ui/misc'
import { ErrorState, ListSkeleton } from '@/components/ui/states'
import { FilamentSelect, filamentLabel } from '@/features/filaments/FilamentSelect'
import { JobDialog } from '@/features/queue/JobDialog'
import { DELIVERY, ORDER_STATUSES, ORDER_STATUS_LABEL, PAYMENT, PAYMENT_KIND, nextStatus, type OrderStatus } from '@/lib/constants'
import { brl, date, dateTime, docNumber, duration, formatPhone, grams, todayISO } from '@/lib/format'
import { compressImage } from '@/lib/image'
import { keys, must, useAction, useFilaments } from '@/lib/queries'
import { errorMessage, photoUrl, supabase, uploadPhoto } from '@/lib/supabase'
import type { Filament, PrintJob } from '@/lib/types'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { useOrder, useSetOrderStatus, type OrderDetail } from './api'
import { DueChip } from './DueChip'

export function trackingUrl(token: string) {
  return `${window.location.origin}/acompanhar/${token}`
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const order = useOrder(id)
  const filaments = useFilaments()
  const o = order.data

  return (
    <>
      <PageHeader
        back={<BackButton fallback="/pedidos" />}
        title={
          <span className="flex items-center gap-2">
            {o ? docNumber(o.number) : 'Pedido'}
            {o && <StatusBadge key={o.status} status={o.status as OrderStatus} className="animate-pop" />}
          </span>
        }
        description={o?.customer?.name}
      />
      <Page>
        {order.isPending || filaments.isPending ? (
          <ListSkeleton rows={3} height="h-40" />
        ) : order.error ? (
          <ErrorState error={order.error} onRetry={() => order.refetch()} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              <StatusCard order={o!} />
              <ItemsCard order={o!} filaments={filaments.data ?? []} />
              <JobsCard order={o!} filaments={filaments.data ?? []} />
              <PhotosCard order={o!} />
              <FailuresCard order={o!} filaments={filaments.data ?? []} />
            </div>
            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              <PaymentsCard order={o!} />
              <DetailsCard key={o!.updated_at} order={o!} />
              <TrackingCard order={o!} />
              <HistoryCard order={o!} />
            </aside>
          </div>
        )}
      </Page>
    </>
  )
}

function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="mb-3 flex min-h-8 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

/* ------------------------------------------------------------------ status */

function StatusCard({ order }: { order: OrderDetail }) {
  const status = order.status as OrderStatus
  const setStatus = useSetOrderStatus()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const next = nextStatus(status)
  const idx = ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number])
  const change = (s: OrderStatus) => setStatus.mutate({ id: order.id, status: s }, { onSuccess: () => toast.success(`Pedido em "${ORDER_STATUS_LABEL[s]}"`) })

  return (
    <Card className="p-4">
      {status === 'cancelado' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">Pedido cancelado.</p>
          <Button size="sm" onClick={() => change('aprovado')}>
            Reabrir pedido
          </Button>
        </div>
      ) : (
        <>
          {/* linha do tempo do status */}
          <ol className="flex items-center gap-1" aria-label="Andamento do pedido">
            {ORDER_STATUSES.map((s, i) => (
              <li key={s} className="flex flex-1 flex-col gap-1.5" aria-current={i === idx ? 'step' : undefined}>
                <span
                  className={cn('h-1.5 rounded-full transition-colors duration-300', i <= idx ? '' : 'bg-surface-3')}
                  style={i <= idx ? { background: `var(--st-${status})` } : undefined}
                />
                <span className={cn('hidden text-[11px] sm:block', i === idx ? 'font-medium text-fg' : 'text-fg-subtle')}>{ORDER_STATUS_LABEL[s]}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {next && (
              <Button variant="primary" onClick={() => change(next)} loading={setStatus.isPending}>
                {next === 'entregue' ? <CheckCircle /> : <ArrowRight />} {next === 'na_fila' ? 'Mandar para a fila' : `Mover para ${ORDER_STATUS_LABEL[next]}`}
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <DueChip due={order.due_date} status={status} withDate />
              <Menu>
                <MenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Mais ações do pedido">
                    <DotsThreeVertical weight="bold" />
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  {ORDER_STATUSES.filter((s) => s !== status).map((s) => (
                    <MenuItem key={s} onSelect={() => change(s)}>
                      <span className="size-2 rounded-full" style={{ background: `var(--st-${s})` }} /> {ORDER_STATUS_LABEL[s]}
                    </MenuItem>
                  ))}
                  <MenuSeparator />
                  <MenuItem danger onSelect={() => setConfirmCancel(true)}>
                    <XCircle /> Cancelar pedido
                  </MenuItem>
                </MenuContent>
              </Menu>
            </div>
          </div>
          {status === 'aprovado' && <p className="mt-3 text-xs text-fg-subtle">Ao mandar para a fila, o app cria uma placa por item (dá para dividir depois).</p>}
        </>
      )}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar pedido?"
        description="As placas que ainda estão na fila saem dela. Pagamentos registrados continuam aparecendo."
        confirmLabel="Cancelar pedido"
        danger
        loading={setStatus.isPending}
        onConfirm={() => setStatus.mutate({ id: order.id, status: 'cancelado' }, { onSuccess: () => setConfirmCancel(false) })}
      />
    </Card>
  )
}

/* ------------------------------------------------------------------ itens */

function ItemsCard({ order, filaments }: { order: OrderDetail; filaments: Filament[] }) {
  return (
    <Section
      title="Itens"
      action={
        order.quote_id && (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/orcamentos/${order.quote_id}`}>Ver orçamento</Link>
          </Button>
        )
      }
    >
      <ul className="divide-y divide-border">
        {order.items.map((it) => {
          const f = filaments.find((x) => x.id === it.filament_id)
          return (
            <li key={it.id} className="flex items-start gap-3 py-2.5 first:pt-0">
              <span className="num mt-0.5 w-8 shrink-0 text-sm text-fg-muted">{it.quantity}x</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{it.description}</p>
                <p className="num mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
                  {f && (
                    <span className="inline-flex items-center gap-1">
                      <ColorSwatch hex={f.color_hex} className="size-3" /> {f.material} {f.color_name}
                    </span>
                  )}
                  <span>{grams(Number(it.grams))}</span>
                  <span>{duration(it.print_minutes)}</span>
                  {it.urgent && <Badge tone="warn">Urgente</Badge>}
                </p>
              </div>
              <div className="text-right">
                <p className="num font-medium">{brl(Number(it.line_total))}</p>
                {it.quantity > 1 && <p className="num text-xs text-fg-subtle">{brl(Number(it.unit_price))} cada</p>}
              </div>
            </li>
          )
        })}
      </ul>
      <dl className="num mt-2 flex flex-col gap-1 border-t border-border pt-3 text-sm">
        {Number(order.delivery_fee) > 0 && (
          <div className="flex justify-between text-fg-muted">
            <dt>Entrega</dt>
            <dd className="text-fg">{brl(Number(order.delivery_fee))}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <dt className="font-medium">Total</dt>
          <dd className="text-lg font-semibold">{brl(Number(order.total))}</dd>
        </div>
      </dl>
    </Section>
  )
}

/* ------------------------------------------------------------------ pagamentos */

function PaymentsCard({ order }: { order: OrderDetail }) {
  const [adding, setAdding] = useState<number | null | false>(false)
  const total = Number(order.total)
  const paid = Number(order.paid_total)
  const remaining = Math.max(0, total - paid)
  const remove = useAction(async (pid: string) => must(await supabase.from('payments').delete().eq('id', pid)), {
    invalidate: [keys.orders],
    success: 'Pagamento removido',
  })

  return (
    <Section title="Pagamento">
      <div className="num grid grid-cols-3 gap-2 text-center">
        <div className="rounded-ui bg-surface-2 px-2 py-2.5">
          <div className="text-xs text-fg-subtle">Total</div>
          <div className="font-semibold">{brl(total)}</div>
        </div>
        <div className="rounded-ui bg-surface-2 px-2 py-2.5">
          <div className="text-xs text-fg-subtle">Pago</div>
          <div className="font-semibold text-ok">{brl(paid)}</div>
        </div>
        <div className="rounded-ui bg-surface-2 px-2 py-2.5">
          <div className="text-xs text-fg-subtle">Restante</div>
          <div className={cn('font-semibold', remaining > 0.009 ? 'text-warn' : 'text-fg')}>{brl(remaining)}</div>
        </div>
      </div>
      {order.payments.length > 0 && (
        <ul className="mt-3 divide-y divide-border text-sm">
          {order.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2">
              <span className="num w-20 text-fg-muted">{date(p.paid_at)}</span>
              <span className="flex-1">
                {PAYMENT_KIND[p.kind]} · {PAYMENT[p.method]}
              </span>
              <span className="num font-medium">{brl(Number(p.amount))}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Remover pagamento" onClick={() => remove.mutate(p.id)}>
                <Trash />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {remaining > 0.009 && order.status !== 'cancelado' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {paid === 0 ? (
            <Button size="sm" onClick={() => setAdding(Math.round(total * 50) / 100)}>
              Sinal 50%
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAdding(remaining)}>
              Quitar restante
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>
            <Plus /> Outro valor
          </Button>
        </div>
      )}
      {adding !== false && <PaymentDialog order={order} amount={adding} onClose={() => setAdding(false)} />}
    </Section>
  )
}

function PaymentDialog({ order, amount: initial, onClose }: { order: OrderDetail; amount: number | null; onClose: () => void }) {
  const paid = Number(order.paid_total)
  const remaining = Number(order.total) - paid
  const [amount, setAmount] = useState<number | null>(initial)
  const [method, setMethod] = useState(order.payment_method ?? 'pix')
  const [kind, setKind] = useState(paid === 0 && initial != null && initial < remaining ? 'sinal' : paid > 0 && initial === remaining ? 'restante' : paid === 0 ? 'sinal' : 'outro')
  const [paidAt, setPaidAt] = useState<string | null>(todayISO())
  const save = useAction(
    async () => {
      must(await supabase.from('payments').insert({ order_id: order.id, amount: amount!, method, kind, paid_at: paidAt ?? todayISO() }))
      if (!order.payment_method) await supabase.from('orders').update({ payment_method: method }).eq('id', order.id)
    },
    { invalidate: [keys.orders, ['customers']], success: 'Pagamento registrado', onSuccess: onClose },
  )
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Registrar pagamento"
      description={`Restante: ${brl(remaining)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!amount || amount <= 0} loading={save.isPending} onClick={() => save.mutate(undefined)}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Valor" className="col-span-2">
          {(p) => <NumberInput {...p} prefix="R$" value={amount} onValueChange={setAmount} />}
        </Field>
        <Field label="Forma">
          {(p) => (
            <Select {...p} value={method} onChange={(e) => setMethod(e.target.value)}>
              {Object.entries(PAYMENT).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Tipo">
          {(p) => (
            <Select {...p} value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(PAYMENT_KIND).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Data" className="col-span-2">
          {(p) => <DateInput {...p} value={paidAt} onValueChange={setPaidAt} />}
        </Field>
      </div>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ dados do pedido */

function DetailsCard({ order }: { order: OrderDetail }) {
  const [due, setDue] = useState<string | null>(order.due_date)
  const [delivery, setDelivery] = useState(order.delivery_method ?? '')
  const [tracking, setTracking] = useState(order.tracking_code ?? '')
  const [fee, setFee] = useState<number | null>(Number(order.delivery_fee))
  const [method, setMethod] = useState(order.payment_method ?? '')
  const [notes, setNotes] = useState(order.notes ?? '')
  const changed =
    due !== order.due_date ||
    delivery !== (order.delivery_method ?? '') ||
    tracking !== (order.tracking_code ?? '') ||
    (fee ?? 0) !== Number(order.delivery_fee) ||
    method !== (order.payment_method ?? '') ||
    notes !== (order.notes ?? '')

  const save = useAction(
    async () =>
      must(
        await supabase
          .from('orders')
          .update({
            due_date: due,
            delivery_method: delivery || null,
            tracking_code: delivery === 'correios' ? tracking.trim().toUpperCase() || null : null,
            delivery_fee: fee ?? 0,
            payment_method: method || null,
            notes: notes.trim() || null,
          })
          .eq('id', order.id),
      ),
    { invalidate: [keys.orders], success: 'Pedido atualizado' },
  )

  return (
    <Section title="Prazo e entrega">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(undefined)
        }}
      >
        {order.customer && (
          <div className="flex items-center justify-between gap-2 rounded-ui bg-surface-2 px-3 py-2">
            <Link to={`/clientes/${order.customer.id}`} className="min-w-0 truncate text-sm font-medium hover:underline">
              {order.customer.name}
            </Link>
            {order.customer.whatsapp && (
              <Button asChild variant="ghost" size="sm">
                <a href={waLink(order.customer.whatsapp)} target="_blank" rel="noreferrer">
                  <WhatsappLogo /> {formatPhone(order.customer.whatsapp)}
                </a>
              </Button>
            )}
          </div>
        )}
        <Field label="Prazo de entrega">{(p) => <DateInput {...p} value={due} onValueChange={setDue} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entrega">
            {(p) => (
              <Select {...p} value={delivery} onChange={(e) => setDelivery(e.target.value)}>
                <option value="">A definir</option>
                {Object.entries(DELIVERY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Taxa de entrega">{(p) => <NumberInput {...p} prefix="R$" value={fee} onValueChange={setFee} />}</Field>
        </div>
        {delivery === 'correios' && (
          <Field label="Código de rastreio" hint="Aparece para o cliente no acompanhamento.">
            {(p) => <Input {...p} autoCapitalize="characters" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="AA123456789BR" />}
          </Field>
        )}
        <Field label="Forma de pagamento">
          {(p) => (
            <Select {...p} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">A definir</option>
              {Object.entries(PAYMENT).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Observações" optional>
          {(p) => <Textarea {...p} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
        <Button type="submit" variant={changed ? 'primary' : 'secondary'} disabled={!changed} loading={save.isPending}>
          Salvar
        </Button>
      </form>
    </Section>
  )
}

/* ------------------------------------------------------------------ placas */

const JOB_STATUS: Record<string, string> = { na_fila: 'Na fila', imprimindo: 'Imprimindo', concluida: 'Concluída', cancelada: 'Cancelada' }

function JobsCard({ order, filaments }: { order: OrderDetail; filaments: Filament[] }) {
  const [editing, setEditing] = useState<PrintJob | 'new' | null>(null)
  const jobs = order.jobs.filter((j) => j.status !== 'cancelada')
  if (!jobs.length && ['aprovado', 'entregue', 'cancelado'].includes(order.status)) return null
  return (
    <Section
      title="Placas de impressão"
      action={
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/fila">
              <Queue /> Fila
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing('new')}>
            <Plus /> Placa
          </Button>
        </div>
      }
    >
      {!jobs.length ? (
        <p className="text-sm text-fg-muted">Nenhuma placa. Adicione as impressões deste pedido.</p>
      ) : (
        <ul className="divide-y divide-border">
          {jobs.map((j) => {
            const f = filaments.find((x) => x.id === j.filament_id)
            return (
              <li key={j.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                {f ? <ColorSwatch hex={f.color_hex} label={filamentLabel(f)} /> : <span className="size-5" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{j.title}</p>
                  <p className="num text-xs text-fg-muted">
                    {grams(Number(j.grams))} · {duration(j.print_minutes)}
                    {j.status === 'concluida' && j.finished_at && ` · concluída ${dateTime(j.finished_at)}`}
                  </p>
                </div>
                <Badge tone={j.status === 'concluida' ? 'ok' : j.status === 'imprimindo' ? 'warn' : 'neutral'}>{JOB_STATUS[j.status]}</Badge>
                {j.status === 'na_fila' && (
                  <Button variant="ghost" size="icon-sm" aria-label={`Editar placa ${j.title}`} onClick={() => setEditing(j)}>
                    <PencilSimple />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {editing && <JobDialog job={editing === 'new' ? undefined : editing} orderId={order.id} onClose={() => setEditing(null)} />}
    </Section>
  )
}

/* ------------------------------------------------------------------ fotos */

function PhotosCard({ order }: { order: OrderDetail }) {
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [removing, setRemoving] = useState<string | null>(null)
  const toggle = useAction(
    async ({ pid, show }: { pid: string; show: boolean }) => must(await supabase.from('order_photos').update({ show_to_customer: show }).eq('id', pid)),
    { invalidate: [keys.order(order.id)] },
  )
  const remove = useAction(
    async (pid: string) => {
      const photo = order.photos.find((p) => p.id === pid)!
      must(await supabase.from('order_photos').delete().eq('id', pid))
      await supabase.storage.from('photos').remove([photo.path])
    },
    { invalidate: [keys.order(order.id)], success: 'Foto removida', onSuccess: () => setRemoving(null) },
  )

  async function upload(files: FileList | null) {
    if (!files?.length) return
    const list = Array.from(files)
    setUploading(list.length)
    try {
      for (const file of list) {
        const small = await compressImage(file)
        const path = await uploadPhoto(`pedidos/${order.id}`, small)
        must(await supabase.from('order_photos').insert({ order_id: order.id, path }))
        setUploading((n) => n - 1)
      }
      toast.success(list.length > 1 ? 'Fotos enviadas' : 'Foto enviada')
    } catch (e) {
      toast.error(`Não deu para enviar: ${errorMessage(e)}`)
    } finally {
      setUploading(0)
      if (input.current) input.current.value = ''
      qc.invalidateQueries({ queryKey: keys.order(order.id) })
    }
  }

  return (
    <Section
      title="Fotos da peça pronta"
      action={
        <Button variant="ghost" size="sm" loading={uploading > 0} onClick={() => input.current?.click()}>
          <Camera /> {uploading > 0 ? `Enviando ${uploading}` : 'Adicionar'}
        </Button>
      }
    >
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      {!order.photos.length ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center gap-1 rounded-ui border border-dashed border-border-strong px-4 py-6 text-sm text-fg-muted hover:bg-surface-2"
        >
          <Camera className="size-6 text-fg-subtle" />
          Tire ou escolha fotos. Quando o pedido estiver pronto, o cliente vê as marcadas no link de acompanhamento.
        </button>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {order.photos.map((p) => (
            <li key={p.id} className="group relative overflow-hidden rounded-ui border border-border">
              <a href={photoUrl(p.path)!} target="_blank" rel="noreferrer">
                <img src={photoUrl(p.path)!} alt="Foto do pedido" className={cn('aspect-square w-full object-cover', !p.show_to_customer && 'opacity-50')} loading="lazy" />
              </a>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1">
                <button
                  type="button"
                  aria-label={p.show_to_customer ? 'Esconder do cliente' : 'Mostrar ao cliente'}
                  title={p.show_to_customer ? 'O cliente vê esta foto' : 'O cliente não vê esta foto'}
                  onClick={() => toggle.mutate({ pid: p.id, show: !p.show_to_customer })}
                  className="flex size-8 items-center justify-center rounded-ui text-white/90 hover:bg-white/15"
                >
                  {p.show_to_customer ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => setRemoving(p.id)}
                  className="flex size-8 items-center justify-center rounded-ui text-white/90 hover:bg-white/15"
                >
                  <Trash className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={removing != null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remover foto?"
        description="A foto é apagada do armazenamento."
        confirmLabel="Remover"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate(removing!)}
      />
    </Section>
  )
}

/* ------------------------------------------------------------------ falhas */

function FailuresCard({ order, filaments }: { order: OrderDetail; filaments: Filament[] }) {
  const [adding, setAdding] = useState(false)
  const remove = useAction(async (fid: string) => must(await supabase.from('failures').delete().eq('id', fid)), {
    invalidate: [keys.orders, keys.filaments, keys.failures],
    success: 'Falha removida (o filamento voltou ao carretel)',
  })
  const lostG = order.failures.reduce((s, f) => s + Number(f.grams_lost), 0)
  const lostMin = order.failures.reduce((s, f) => s + f.minutes_lost, 0)
  return (
    <Section
      title="Falhas de impressão"
      action={
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <WarningOctagon /> Registrar
        </Button>
      }
    >
      {!order.failures.length ? (
        <p className="text-sm text-fg-muted">Nenhuma falha. Registrar as perdas ajuda a calcular a taxa de falha real no financeiro.</p>
      ) : (
        <>
          <ul className="divide-y divide-border text-sm">
            {order.failures.map((f) => {
              const fil = filaments.find((x) => x.id === f.filament_id)
              return (
                <li key={f.id} className="flex items-center gap-2 py-2">
                  <span className="num w-20 text-fg-muted">{date(f.occurred_at)}</span>
                  <span className="min-w-0 flex-1 truncate">{f.reason ?? 'Sem motivo'}{fil && <span className="text-fg-subtle"> · {fil.material} {fil.color_name}</span>}</span>
                  <span className="num text-fg-muted">
                    {grams(Number(f.grams_lost))} · {duration(f.minutes_lost)}
                  </span>
                  <Button variant="ghost" size="icon-sm" aria-label="Remover falha" onClick={() => remove.mutate(f.id)}>
                    <Trash />
                  </Button>
                </li>
              )
            })}
          </ul>
          <p className="num mt-2 text-xs text-fg-subtle">
            Perdido neste pedido: {grams(lostG)} e {duration(lostMin)}
          </p>
        </>
      )}
      {adding && <FailureDialog order={order} filaments={filaments} onClose={() => setAdding(false)} />}
    </Section>
  )
}

function FailureDialog({ order, filaments, onClose }: { order: OrderDetail; filaments: Filament[]; onClose: () => void }) {
  const [filament, setFilament] = useState<string | null>(order.items[0]?.filament_id ?? null)
  const [g, setG] = useState<number | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const save = useAction(
    async () =>
      must(
        await supabase.from('failures').insert({
          order_id: order.id,
          filament_id: filament,
          grams_lost: g ?? 0,
          minutes_lost: minutes ?? 0,
          reason: reason.trim() || null,
        }),
      ),
    { invalidate: [keys.orders, keys.filaments, keys.failures], success: 'Falha registrada', onSuccess: onClose },
  )
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Registrar falha"
      description="O filamento perdido sai do carretel."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={save.isPending} disabled={!g && !minutes} onClick={() => save.mutate(undefined)}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Carretel" className="col-span-2">
          {(p) => <FilamentSelect {...p} filaments={filaments} value={filament} onChange={setFilament} />}
        </Field>
        <Field label="Filamento perdido">{(p) => <NumberInput {...p} suffix="g" digits={1} value={g} onValueChange={setG} />}</Field>
        <Field label="Tempo perdido">{(p) => <DurationInput {...p} value={minutes} onValueChange={setMinutes} />}</Field>
        <Field label="O que aconteceu" optional className="col-span-2">
          {(p) => <Input {...p} value={reason} placeholder="Ex.: entupiu o bico" onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </div>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ acompanhamento */

function TrackingCard({ order }: { order: OrderDetail }) {
  const url = trackingUrl(order.public_token)
  const first = order.customer?.name.trim().split(/\s+/)[0]
  const text = `Olá${first ? `, ${first}` : ''}! Você pode acompanhar o pedido ${docNumber(order.number)} da Zanshin 3D Studio por aqui: ${url}`
  return (
    <Section title="Link para o cliente">
      <p className="text-sm text-fg-muted">Mostra só itens, andamento, prazo e fotos. Sem valores.</p>
      <div className="mt-3 flex items-center gap-2 rounded-ui border border-border bg-surface-2 px-3 py-2">
        <LinkSimple className="size-4 shrink-0 text-fg-subtle" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-muted">{url}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(url)
            toast.success('Link copiado')
          }}
        >
          <Copy /> Copiar
        </Button>
        <Button asChild size="sm">
          <a href={waLink(order.customer?.whatsapp, text)} target="_blank" rel="noreferrer">
            <WhatsappLogo /> Enviar
          </a>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <a href={url} target="_blank" rel="noreferrer">
            <Eye /> Ver
          </a>
        </Button>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ histórico */

function HistoryCard({ order }: { order: OrderDetail }) {
  const [open, setOpen] = useState(false)
  const events = [...order.events].reverse()
  const shown = open ? events : events.slice(0, 4)
  return (
    <Section title="Histórico">
      <ol className="relative flex flex-col gap-3 border-l border-border pl-4">
        {shown.map((e) => (
          <li key={e.id} className="relative text-sm">
            <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-surface" style={{ background: `var(--st-${e.to_status})` }} />
            <span className="font-medium">{ORDER_STATUS_LABEL[e.to_status as OrderStatus] ?? e.to_status}</span>
            <span className="num block text-xs text-fg-subtle">{dateTime(e.created_at)}</span>
          </li>
        ))}
      </ol>
      {events.length > 4 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen((o) => !o)}>
          {open ? 'Mostrar menos' : `Ver tudo (${events.length})`}
        </Button>
      )}
    </Section>
  )
}
