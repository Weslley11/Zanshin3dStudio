import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calculator, CheckCircle, DownloadSimple, Image, Queue, Trash, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Field, Input, NumberInput, Select, Textarea } from '@/components/ui/field'
import { Badge, Card, ColorSwatch, Skeleton } from '@/components/ui/misc'
import { ErrorState, ListSkeleton } from '@/components/ui/states'
import { useCatalog } from '@/features/catalog/api'
import { CustomerPicker } from '@/features/customers/CustomerPicker'
import { FilamentSelect, filamentLabel } from '@/features/filaments/FilamentSelect'
import { shareImageFile } from '@/features/quotes/exportQuote'
import { brl, docNumber, duration, grams, number } from '@/lib/format'
import { keys, must, useAction, useFilaments, usePrinters, useSettings } from '@/lib/queries'
import { errorMessage, PHOTO_BUCKET, photoUrl, supabase } from '@/lib/supabase'
import type { Filament } from '@/lib/types'
import { MODEL_BUCKET, formatLabel, mainFilament, matchFilament, modelKeys, signedDownloadUrl, storedPlates, useModel, useModelMesh, type ModelRow, type StoredPlate } from './api'
import { DENSITY, estimateGrams, fitsBed } from './geometry'

const ModelViewer = lazy(() => import('./ModelViewer'))

export type QuotePrefill = {
  description: string
  grams: number | null
  print_minutes: number | null
  filament_id: string | null
  catalog_item_id?: string | null
  category?: string | null
}

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const model = useModel(id)
  const mesh = useModelMesh(model.data)
  const filaments = useFilaments()
  const printers = usePrinters()
  const settings = useSettings()
  const [filamentId, setFilamentId] = useState<string | null>(null)

  const m = model.data
  const stock = filaments.data ?? []
  const filament = stock.find((f) => f.id === filamentId)
  const color = filament?.color_hex ?? '#b9bec5'
  const printer = printers.data?.find((p) => p.id === settings.data?.default_printer_id) ?? printers.data?.[0]
  const bed = printer?.bed_x_mm && printer.bed_y_mm && printer.bed_z_mm ? { x: Number(printer.bed_x_mm), y: Number(printer.bed_y_mm), z: Number(printer.bed_z_mm) } : null

  return (
    <>
      <PageHeader back={<BackButton fallback="/modelos" />} title={m?.name ?? 'Modelo'} description={m ? `${formatLabel(m.format)} · ${m.file_name}` : undefined} />
      <Page>
        {model.isPending ? (
          <ListSkeleton rows={2} height="h-72" />
        ) : model.error ? (
          <ErrorState error={model.error} onRetry={() => model.refetch()} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              {mesh.isPending ? (
                <Skeleton className="h-[52vh] min-h-72" />
              ) : mesh.error ? (
                <ErrorState error={mesh.error} onRetry={() => mesh.refetch()} />
              ) : mesh.data.parts.length ? (
                <Suspense fallback={<Skeleton className="h-[52vh] min-h-72" />}>
                  {/* com várias placas as peças ficam espalhadas: a mesa desenhada no meio confundiria */}
                  <ModelViewer parts={mesh.data.parts} color={color} bed={storedPlates(m!).length > 1 ? null : bed} className="h-[52vh] min-h-72" />
                </Suspense>
              ) : (
                <Card className="p-6 text-center text-sm text-fg-muted">Este arquivo não tem a malha 3D, só as placas fatiadas.</Card>
              )}
              <ColorCard stock={stock} filamentId={filamentId} onChange={setFilamentId} model={m!} canRender={Boolean(mesh.data?.parts.length)} parts={mesh.data?.parts ?? []} color={color} />
              {storedPlates(m!).length > 0 && <PlatesCard model={m!} stock={stock} />}
            </div>
            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              <SizeCard model={m!} bed={bed} printerName={printer?.name} />
              {m!.volume_cm3 != null && !storedPlates(m!).length && <EstimateCard model={m!} filament={filament} stock={stock} onFilament={setFilamentId} />}
              <LinksCard key={m!.updated_at} model={m!} />
              <FileCard model={m!} />
            </aside>
          </div>
        )}
      </Page>
    </>
  )
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex min-h-8 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

/* ------------------------------------------------------------------ cor e imagem */

function ColorCard({
  stock,
  filamentId,
  onChange,
  model,
  canRender,
  parts,
  color,
}: {
  stock: Filament[]
  filamentId: string | null
  onChange: (id: string | null) => void
  model: ModelRow
  canRender: boolean
  parts: import('./parse').Part[]
  color: string
}) {
  const [busy, setBusy] = useState(false)
  const active = stock.filter((f) => !f.archived)
  async function shareImage() {
    setBusy(true)
    try {
      const { renderImage } = await import('./scene')
      const blob = await renderImage(parts, color, 1200, 900, '#eef0f3')
      const label = filamentId ? ` - ${filamentLabel(stock.find((f) => f.id === filamentId)!)}` : ''
      await shareImageFile(new File([blob], `${model.name}${label}.png`, { type: 'image/png' }))
    } catch (e) {
      toast.error(`Não deu para gerar a imagem: ${errorMessage(e)}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Section
      title="Ver na cor do carretel"
      action={
        canRender && (
          <Button size="sm" variant="ghost" onClick={shareImage} loading={busy}>
            <Image /> Imagem para o cliente
          </Button>
        )
      }
    >
      {!active.length ? (
        <p className="text-sm text-fg-muted">Cadastre carretéis em Filamentos para ver o modelo nas cores que você tem.</p>
      ) : (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor do modelo">
          <button
            type="button"
            role="radio"
            aria-checked={!filamentId}
            onClick={() => onChange(null)}
            className={`flex h-9 items-center gap-2 rounded-ui border px-2.5 text-xs ${!filamentId ? 'border-ring' : 'border-border'}`}
          >
            <ColorSwatch hex="#b9bec5" className="size-4" /> Neutro
          </button>
          {active.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filamentId === f.id}
              onClick={() => onChange(f.id)}
              className={`flex h-9 items-center gap-2 rounded-ui border px-2.5 text-xs ${filamentId === f.id ? 'border-ring' : 'border-border'}`}
            >
              <ColorSwatch hex={f.color_hex} className="size-4" /> {f.material} {f.color_name}
            </button>
          ))}
        </div>
      )}
    </Section>
  )
}

/* ------------------------------------------------------------------ medidas */

function SizeCard({ model, bed, printerName }: { model: ModelRow; bed: { x: number; y: number; z: number } | null; printerName?: string }) {
  if (model.size_x_mm == null) return null
  const s = { sizeX: Number(model.size_x_mm), sizeY: Number(model.size_y_mm), sizeZ: Number(model.size_z_mm) }
  const fits = bed ? fitsBed(s, bed) : null
  return (
    <Section title={(model.parts ?? 1) > 1 ? `Medidas da maior peça (${model.parts} peças)` : 'Medidas'}>
      <p className="num text-2xl font-semibold tracking-tight">
        {number(s.sizeX, 1)} × {number(s.sizeY, 1)} × {number(s.sizeZ, 1)} <span className="text-base font-normal text-fg-muted">mm</span>
      </p>
      <p className="num mt-1 text-xs text-fg-muted">
        largura × profundidade × altura · {number(Number(model.volume_cm3), 1)} cm³ · {number(model.triangles ?? 0)} triângulos
      </p>
      {fits != null ? (
        <p className={`mt-3 flex items-center gap-1.5 text-sm ${fits ? 'text-ok' : 'text-accent-text'}`}>
          {fits ? <CheckCircle weight="fill" /> : <Warning weight="fill" />}
          {fits ? `Cabe na ${printerName}` : `Não cabe na ${printerName} (${bed!.x} × ${bed!.y} × ${bed!.z} mm). Divida a peça ou mude a escala.`}
        </p>
      ) : (
        <p className="mt-3 text-xs text-fg-subtle">Preencha a área de impressão da impressora em Configurações para conferir se cabe.</p>
      )}
    </Section>
  )
}

/* ------------------------------------------------------------------ estimativa */

function EstimateCard({ model, filament, stock, onFilament }: { model: ModelRow; filament?: Filament; stock: Filament[]; onFilament: (id: string | null) => void }) {
  const navigate = useNavigate()
  // padrões do Bambu Studio: 15% de preenchimento e ~0,9 mm de paredes/topo/fundo
  const [infill, setInfill] = useState<number | null>(15)
  const [wall, setWall] = useState<number | null>(0.9)
  const material = filament?.material ?? 'PLA'
  const g = estimateGrams({
    volumeCm3: Number(model.volume_cm3),
    areaCm2: Number(model.area_cm2),
    density: DENSITY[material] ?? DENSITY.PLA,
    infillPct: infill ?? 15,
    wallMm: wall ?? 0.9,
  })
  const cost = filament?.cost_per_g != null ? g * Number(filament.cost_per_g) : null

  return (
    <Section title="Estimativa sem fatiar">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Carretel" className="col-span-2">
          {(p) => <FilamentSelect {...p} filaments={stock} value={filament?.id ?? null} onChange={onFilament} allowEmpty="PLA genérico" />}
        </Field>
        <Field label="Preenchimento">{(p) => <NumberInput {...p} suffix="%" digits={0} value={infill} onValueChange={setInfill} />}</Field>
        <Field label="Paredes">{(p) => <NumberInput {...p} suffix="mm" digits={2} value={wall} onValueChange={setWall} />}</Field>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm text-fg-muted">Cerca de</span>
        <span className="num text-2xl font-semibold">{grams(Math.round(g))}</span>
      </div>
      {cost != null && <p className="num text-right text-xs text-fg-muted">material ≈ {brl(cost)}</p>}
      <p className="mt-2 text-xs text-fg-subtle">
        Estimativa pelo volume ({material}, {number(DENSITY[material] ?? DENSITY.PLA, 2)} g/cm³). Suportes e borda não entram. Para o número exato, fatie no Bambu Studio e
        envie o .gcode.3mf.
      </p>
      <Button
        className="mt-3 w-full"
        onClick={() =>
          navigate('/orcamentos/novo', {
            state: {
              customerId: model.customer_id,
              prefill: [{ description: model.name, grams: Math.round(g), print_minutes: null, filament_id: filament?.id ?? null, catalog_item_id: model.catalog_item_id }] satisfies QuotePrefill[],
            },
          })
        }
      >
        <Calculator /> Orçar com esta estimativa
      </Button>
    </Section>
  )
}

/* ------------------------------------------------------------------ placas fatiadas */

function PlatesCard({ model, stock }: { model: ModelRow; stock: Filament[] }) {
  const navigate = useNavigate()
  const plates = storedPlates(model)
  const [queueing, setQueueing] = useState(false)
  const totalMin = plates.reduce((s, p) => s + p.minutes, 0)
  const totalG = plates.reduce((s, p) => s + p.grams, 0)

  const prefill: QuotePrefill[] = plates.map((p) => ({
    description: plates.length > 1 ? `${model.name} (placa ${p.index})` : model.name,
    grams: p.grams,
    print_minutes: p.minutes,
    filament_id: matchFilament(stock, mainFilament(p.filaments))?.id ?? null,
    catalog_item_id: model.catalog_item_id,
  }))

  return (
    <Section title={`Placas fatiadas · ${duration(totalMin)} · ${grams(totalG)}`}>
      <ul className="flex flex-col divide-y divide-border">
        {plates.map((p) => (
          <PlateRow key={p.index} p={p} stock={stock} />
        ))}
      </ul>
      <p className="mt-2 text-xs text-fg-subtle">Tempo e gramas calculados pelo Bambu Studio. O carretel sugerido é o do estoque com material e cor mais parecidos; dá para trocar no orçamento.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button variant="primary" onClick={() => navigate('/orcamentos/novo', { state: { customerId: model.customer_id, prefill } })}>
          <Calculator /> Orçar estas placas
        </Button>
        <Button onClick={() => setQueueing(true)}>
          <Queue /> Mandar para a fila
        </Button>
      </div>
      {queueing && <QueueDialog model={model} plates={plates} stock={stock} onClose={() => setQueueing(false)} />}
    </Section>
  )
}

function fileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${number(bytes / 1024 / 1024, 1)} MB` : `${number(Math.max(1, Math.round(bytes / 1024)))} KB`
}

function PlateRow({ p, stock }: { p: StoredPlate; stock: Filament[] }) {
  const match = matchFilament(stock, mainFilament(p.filaments))
  const [broken, setBroken] = useState(false)
  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      {p.thumbnail_path && !broken ? (
        <img
          src={photoUrl(p.thumbnail_path)!}
          alt={`Placa ${p.index}`}
          onError={() => setBroken(true)}
          className="size-16 shrink-0 rounded-ui border border-border bg-surface-2 object-contain"
          loading="lazy"
        />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-ui bg-surface-2 text-xs text-fg-subtle">Placa {p.index}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">Placa {p.index}</span>
          <span className="num text-sm">
            {duration(p.minutes)} · {grams(p.grams)}
          </span>
        </div>
        {p.objects.length > 0 && <p className="truncate text-xs text-fg-muted">{p.objects.join(', ')}</p>}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {p.filaments.map((f, i) => (
            <Badge key={i} className="num">
              <ColorSwatch hex={f.color} className="size-3" /> {f.type} {grams(f.grams)}
            </Badge>
          ))}
        </div>
        <p className="mt-1 text-xs text-fg-subtle">{match ? `Do estoque: ${filamentLabel(match)}` : 'Nenhum carretel parecido no estoque'}</p>
      </div>
    </li>
  )
}

function QueueDialog({ model, plates, stock, onClose }: { model: ModelRow; plates: StoredPlate[]; stock: Filament[]; onClose: () => void }) {
  const settings = useSettings().data
  const [orderId, setOrderId] = useState<string>(model.order_id ?? '')
  const orders = useQuery({
    queryKey: [...keys.orders, 'abertos'],
    queryFn: async () =>
      must(await supabase.from('orders').select('id, number, customer:customers(name)').not('status', 'in', '(entregue,cancelado)').order('number', { ascending: false })) as unknown as {
        id: string
        number: number
        customer: { name: string } | null
      }[],
  })
  const send = useAction(
    async () =>
      must(
        await supabase.from('print_jobs').insert(
          plates.map((p, i) => ({
            title: plates.length > 1 ? `${model.name} · placa ${p.index}` : model.name,
            grams: p.grams,
            print_minutes: p.minutes,
            filament_id: matchFilament(stock, mainFilament(p.filaments))?.id ?? null,
            printer_id: settings?.default_printer_id ?? null,
            order_id: orderId || null,
            model_id: model.id,
            source: '3mf',
            source_file_path: model.file_path,
            plate_index: p.index,
            meta: { filaments: p.filaments },
            position: Date.now() / 1000 + i * 0.001,
          })),
        ),
      ),
    { invalidate: [keys.jobs, keys.orders], success: plates.length > 1 ? `${plates.length} placas na fila` : 'Placa na fila', onSuccess: onClose },
  )
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Mandar para a fila"
      description={`${plates.length} ${plates.length === 1 ? 'placa' : 'placas'} com tempo e gramas do fatiador`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={send.isPending} onClick={() => send.mutate(undefined)}>
            Mandar para a fila
          </Button>
        </>
      }
    >
      <Field label="Pedido" optional hint="Sem pedido = placa avulsa (estoque, teste).">
        {(p) => (
          <Select {...p} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">Sem pedido</option>
            {(orders.data ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {docNumber(o.number)} · {o.customer?.name ?? 'Sem cliente'}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ vínculos */

function LinksCard({ model }: { model: ModelRow }) {
  const catalog = useCatalog()
  const [name, setName] = useState(model.name)
  const [catalogId, setCatalogId] = useState(model.catalog_item_id ?? '')
  const [orderId, setOrderId] = useState(model.order_id ?? '')
  const [customerId, setCustomerId] = useState<string | null>(model.customer_id)
  const [notes, setNotes] = useState(model.notes ?? '')
  const orders = useQuery({
    queryKey: [...keys.orders, 'para-vincular'],
    queryFn: async () =>
      must(await supabase.from('orders').select('id, number, customer:customers(name)').order('number', { ascending: false }).limit(100)) as unknown as {
        id: string
        number: number
        customer: { name: string } | null
      }[],
  })
  const save = useAction(
    async () =>
      must(
        await supabase
          .from('models')
          .update({ name: name.trim() || model.name, catalog_item_id: catalogId || null, order_id: orderId || null, customer_id: customerId, notes: notes.trim() || null })
          .eq('id', model.id),
      ),
    { invalidate: [modelKeys.all], success: 'Modelo atualizado' },
  )
  return (
    <Section title="Nome e vínculos">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(undefined)
        }}
      >
        <Field label="Nome">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Peça do catálogo" optional>
          {(p) => (
            <Select {...p} value={catalogId} onChange={(e) => setCatalogId(e.target.value)}>
              <option value="">Nenhuma</option>
              {(catalog.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Pedido" optional>
          {(p) => (
            <Select {...p} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">Nenhum</option>
              {(orders.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {docNumber(o.number)} · {o.customer?.name ?? 'Sem cliente'}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Cliente" optional>
          {(p) => <CustomerPicker {...p} value={customerId} onChange={setCustomerId} />}
        </Field>
        <Field label="Observações" optional>
          {(p) => <Textarea {...p} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
        <Button type="submit" loading={save.isPending}>
          Salvar
        </Button>
      </form>
    </Section>
  )
}

/* ------------------------------------------------------------------ arquivo */

function FileCard({ model }: { model: ModelRow }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const remove = useAction(
    async () => {
      const images = [model.thumbnail_path, ...storedPlates(model).map((p) => p.thumbnail_path)].filter(Boolean) as string[]
      must(await supabase.from('models').delete().eq('id', model.id))
      await supabase.storage.from(MODEL_BUCKET).remove([model.file_path])
      if (images.length) await supabase.storage.from(PHOTO_BUCKET).remove(images)
    },
    { invalidate: [modelKeys.all], success: 'Modelo excluído', onSuccess: () => navigate('/modelos', { replace: true }) },
  )
  return (
    <Section title="Arquivo">
      <p className="num truncate text-sm text-fg-muted">
        {model.file_name} · {fileSize(model.file_size ?? 0)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          onClick={async () => {
            try {
              window.location.href = await signedDownloadUrl(model.file_path, model.file_name)
            } catch (e) {
              toast.error(errorMessage(e))
            }
          }}
        >
          <DownloadSimple /> Baixar
        </Button>
        <Button size="sm" variant="danger" onClick={() => setDeleting(true)}>
          <Trash /> Excluir
        </Button>
      </div>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Excluir modelo?"
        description="O arquivo e as miniaturas são apagados. Orçamentos, pedidos e placas da fila continuam como estão."
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
      />
    </Section>
  )
}
