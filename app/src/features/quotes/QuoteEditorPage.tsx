import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { QuotePrefill } from '@/features/models/ModelDetailPage'
import { FloppyDisk } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/button'
import { DateInput, Field, NumberInput, Textarea } from '@/components/ui/field'
import { Badge, Card } from '@/components/ui/misc'
import { ErrorState, ListSkeleton } from '@/components/ui/states'
import { CustomerPicker } from '@/features/customers/CustomerPicker'
import { missingSettings } from '@/features/settings/missing'
import { QUOTE_STATUS_LABEL } from '@/lib/constants'
import { addDaysISO, brl, daysUntil, docNumber, todayISO } from '@/lib/format'
import { keys, must, useAction, useFilaments, usePrinters, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useQuote, type QuoteWithItems } from './api'
import { fromRow, newItem, toRow, validate } from './draft'
import { ItemsEditorList, useItemsDraft } from './ItemsDraft'
import { AnimatedNumber } from '@/components/ui/motion'
import { QuoteActions } from './QuoteActions'

export function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const quote = useQuote(id)
  const settings = useSettings()
  const printers = usePrinters()
  const filaments = useFilaments()

  const loading = settings.isPending || printers.isPending || filaments.isPending || (id && quote.isPending)
  const error = settings.error || printers.error || filaments.error || quote.error

  return (
    <>
      {loading ? (
        <>
          <PageHeader back={<BackButton fallback="/orcamentos" />} title={id ? 'Orçamento' : 'Novo orçamento'} />
          <Page>
            <ListSkeleton rows={2} height="h-72" />
          </Page>
        </>
      ) : error ? (
        <>
          <PageHeader back={<BackButton fallback="/orcamentos" />} title="Orçamento" />
          <Page>
            <ErrorState error={error} onRetry={() => (quote.refetch(), settings.refetch(), printers.refetch(), filaments.refetch())} />
          </Page>
        </>
      ) : (
        <Editor key={quote.data?.updated_at ?? 'novo'} quote={quote.data ?? null} />
      )}
    </>
  )
}

function Editor({ quote }: { quote: QuoteWithItems | null }) {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  // peças vindas da aba Modelos (estimativa ou placas fatiadas)
  const incoming = (useLocation().state ?? null) as { prefill?: QuotePrefill[]; customerId?: string | null } | null
  const settings = useSettings().data!
  const printers = usePrinters().data!
  const readOnly = quote?.status === 'aprovado'

  const draft = useItemsDraft(({ paramsFor, defaultPrinterId }) =>
    quote
      ? quote.items.map(fromRow)
      : incoming?.prefill?.length
        ? incoming.prefill.map((p) =>
            newItem(paramsFor(defaultPrinterId, p.filament_id), defaultPrinterId, {
              description: p.description,
              grams: p.grams,
              print_minutes: p.print_minutes,
              filament_id: p.filament_id,
              catalog_item_id: p.catalog_item_id ?? null,
              category: p.category ?? null,
            }),
          )
        : [newItem(paramsFor(defaultPrinterId, null), defaultPrinterId)],
  )
  const { items, markDirty, isDirty } = draft

  const [customerId, setCustomerId] = useState<string | null>(quote?.customer_id ?? incoming?.customerId ?? search.get('cliente'))
  const [validUntil, setValidUntil] = useState<string | null>(
    quote ? quote.valid_until : settings.quote_validity_days ? addDaysISO(todayISO(), settings.quote_validity_days) : null,
  )
  const [deliveryFee, setDeliveryFee] = useState<number | null>(quote ? Number(quote.delivery_fee) : null)
  const [notes, setNotes] = useState(quote?.notes ?? '')
  const [internalNotes, setInternalNotes] = useState(quote?.internal_notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const itemsTotal = draft.itemsTotal
  const total = itemsTotal + (deliveryFee ?? 0)
  const missing = missingSettings(settings, printers)

  const save = useAction(
    async () => {
      const id = must(
        await supabase.rpc('save_quote', {
          p_quote: {
            id: quote?.id ?? '',
            customer_id: customerId ?? '',
            valid_until: validUntil ?? '',
            delivery_fee: deliveryFee ?? 0,
            notes: notes.trim(),
            internal_notes: internalNotes.trim(),
          },
          p_items: items.map(toRow),
        }),
      ) as string
      return id
    },
    {
      invalidate: [keys.quotes, ['quotes'], ['customers']],
      success: quote ? 'Orçamento salvo' : 'Orçamento criado',
      onSuccess: (newId) => {
        draft.markSaved()
        if (!quote) navigate(`/orcamentos/${newId}`, { replace: true })
      },
    },
  )

  function submit() {
    const err = validate(items)
    setFormError(err)
    if (!err) save.mutate(undefined)
  }

  const expired = quote?.valid_until && quote.status !== 'aprovado' && daysUntil(quote.valid_until) < 0

  return (
    <>
      <PageHeader
        back={<BackButton fallback="/orcamentos" />}
        title={
          <span className="flex items-center gap-2">
            {quote ? docNumber(quote.number) : 'Novo orçamento'}
            {quote && <Badge tone={quote.status === 'aprovado' ? 'ok' : 'neutral'}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>}
            {expired && <Badge tone="warn">Vencido</Badge>}
          </span>
        }
        description={quote?.customer?.name}
      />
      <Page>
        {readOnly && quote?.order && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-ui border border-border bg-surface p-4 text-sm">
            <span>Este orçamento foi aprovado e virou pedido. Para mudar valores, edite o pedido.</span>
            <Button asChild size="sm">
              <Link to={`/pedidos/${quote.order.id}`}>Ver pedido</Link>
            </Button>
          </div>
        )}
        {!readOnly && missing.length > 0 && (
          <div role="status" className="mb-4 rounded-ui border border-accent/40 bg-accent-soft p-4 text-sm">
            Para a calculadora dar preço, preencha em{' '}
            <Link to="/configuracoes" className="font-medium text-accent-text underline underline-offset-2">
              Configurações
            </Link>
            : {missing.join(', ')}. Enquanto isso, dá para digitar o preço à mão.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <Card className="p-4 lg:hidden">
              <Field label="Cliente">{(p) => <CustomerPicker {...p} value={customerId} onChange={(v) => (markDirty(), setCustomerId(v))} disabled={readOnly} />}</Field>
            </Card>

            <ItemsEditorList draft={draft} readOnly={readOnly} />
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <Card className="flex flex-col gap-4 p-4">
              <Field label="Cliente" className="hidden lg:flex">
                {(p) => <CustomerPicker {...p} value={customerId} onChange={(v) => (markDirty(), setCustomerId(v))} disabled={readOnly} />}
              </Field>
              <fieldset disabled={readOnly} className="flex flex-col gap-4">
                <Field label="Válido até">{(p) => <DateInput {...p} value={validUntil} onValueChange={(v) => (markDirty(), setValidUntil(v))} />}</Field>
                <Field label="Entrega" hint="Motoboy ou frete, se cobrar à parte." optional>
                  {(p) => <NumberInput {...p} prefix="R$" value={deliveryFee} onValueChange={(v) => (markDirty(), setDeliveryFee(v))} />}
                </Field>
                <Field label="Observações para o cliente" hint="Vão no texto do WhatsApp e no PDF." optional>
                  {(p) => <Textarea {...p} rows={3} value={notes} onChange={(e) => (markDirty(), setNotes(e.target.value))} />}
                </Field>
                <Field label="Anotações internas" hint="Só você vê." optional>
                  {(p) => <Textarea {...p} rows={2} value={internalNotes} onChange={(e) => (markDirty(), setInternalNotes(e.target.value))} />}
                </Field>
              </fieldset>
              <dl className="num flex flex-col gap-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-fg-muted">
                  <dt>Peças</dt>
                  <dd className="text-fg">{brl(itemsTotal)}</dd>
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
              </dl>
              {formError && (
                <p role="alert" className="text-sm text-danger">
                  {formError}
                </p>
              )}
              {!readOnly && (
                <Button variant="primary" size="lg" onClick={submit} loading={save.isPending} className="hidden lg:inline-flex">
                  <FloppyDisk /> {quote ? 'Salvar alterações' : 'Criar orçamento'}
                </Button>
              )}
            </Card>

            {quote && <QuoteActions quote={quote} dirty={isDirty} />}
          </aside>
        </div>
        {!readOnly && <div className="h-20 lg:hidden" aria-hidden />}
      </Page>

      {/* barra fixa no celular, acima da navegação */}
      {!readOnly && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-fg-subtle">Total</div>
              <div className={cn('num text-lg leading-tight font-semibold')}>
                <AnimatedNumber value={total} format={brl} />
              </div>
            </div>
            <Button variant="primary" size="lg" onClick={submit} loading={save.isPending}>
              <FloppyDisk /> {quote ? 'Salvar' : 'Criar orçamento'}
            </Button>
          </div>
          {formError && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {formError}
            </p>
          )}
        </div>
      )}

    </>
  )
}
