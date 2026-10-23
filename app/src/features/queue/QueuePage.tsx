import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  DotsSixVertical,
  DotsThreeVertical,
  PencilSimple,
  Play,
  Plus,
  Printer as PrinterIcon,
  Queue as QueueIcon,
  Trash,
  Warning,
  WarningOctagon,
} from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Card, ColorSwatch, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Segmented } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { filamentLabel } from '@/features/filaments/FilamentSelect'
import { useNow } from '@/hooks/useNow'
import { dateTime, docNumber, duration, grams, relativeDateTime } from '@/lib/format'
import { keys, must, useAction, useFilaments, usePrinters, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Filament, PrintJob } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FailDialog, JobDialog } from './JobDialog'
import { schedule, type Scheduled } from './schedule'
import { AnimatePresence, m } from 'motion/react'
import { ProgressFill } from '@/components/ui/motion'
import { PrintStage } from '@/components/print/PrintStage'
import { jobProgress, pieceFor } from '@/components/print/timeline'
import { spring } from '@/lib/motion'

type JobRow = PrintJob & { order: { id: string; number: number; customer: { name: string } | null } | null }

function useJobs() {
  return useQuery({
    queryKey: keys.jobs,
    queryFn: async () => {
      const [active, done] = await Promise.all([
        supabase.from('print_jobs').select('*, order:orders(id, number, customer:customers(name))').in('status', ['na_fila', 'imprimindo']).order('position'),
        supabase
          .from('print_jobs')
          .select('*, order:orders(id, number, customer:customers(name))')
          .eq('status', 'concluida')
          .order('finished_at', { ascending: false })
          .limit(8),
      ])
      return { active: must(active) as unknown as JobRow[], done: must(done) as unknown as JobRow[] }
    },
    refetchInterval: 60_000,
  })
}

function useOpenOrders() {
  return useQuery({
    queryKey: [...keys.orders, 'abertos'],
    queryFn: async () =>
      must(
        await supabase
          .from('orders')
          .select('id, number, customer:customers(name)')
          .not('status', 'in', '(entregue,cancelado)')
          .order('number', { ascending: false }),
      ) as unknown as { id: string; number: number; customer: { name: string } | null }[],
  })
}

export function QueuePage() {
  const jobs = useJobs()
  const printers = usePrinters()
  const settings = useSettings()
  const filaments = useFilaments()
  const orders = useOpenOrders()
  const [printerId, setPrinterId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const activePrinters = (printers.data ?? []).filter((p) => p.active)
  const selected = printerId ?? settings.data?.default_printer_id ?? activePrinters[0]?.id ?? null
  // placas sem impressora caem na padrão
  const forPrinter = (j: PrintJob) => (j.printer_id ?? settings.data?.default_printer_id) === selected

  return (
    <>
      <PageHeader
        title="Fila de impressão"
        description="Arraste para reordenar. A previsão de término é encadeada a partir de agora."
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus /> <span className="hidden sm:inline">Nova placa</span>
            <span className="sm:hidden">Placa</span>
          </Button>
        }
      />
      <Page>
        {jobs.isPending || printers.isPending || filaments.isPending ? (
          <ListSkeleton rows={4} height="h-20" />
        ) : jobs.error ? (
          <ErrorState error={jobs.error} onRetry={() => jobs.refetch()} />
        ) : (
          <>
            {activePrinters.length > 1 && (
              <Segmented
                label="Impressora"
                className="mb-4"
                value={selected ?? ''}
                onChange={setPrinterId}
                options={activePrinters.map((p) => ({ value: p.id, label: p.name }))}
              />
            )}
            <PrinterQueue
              key={selected}
              jobs={jobs.data.active.filter(forPrinter)}
              done={jobs.data.done.filter(forPrinter)}
              filaments={filaments.data ?? []}
              printerName={activePrinters.find((p) => p.id === selected)?.name ?? 'Impressora'}
              onAdd={() => setAdding(true)}
            />
          </>
        )}
      </Page>
      {adding && <JobDialog orders={orders.data ?? []} onClose={() => setAdding(false)} />}
    </>
  )
}

function PrinterQueue({
  jobs,
  done,
  filaments,
  printerName,
  onAdd,
}: {
  jobs: JobRow[]
  done: JobRow[]
  filaments: Filament[]
  printerName: string
  onAdd: () => void
}) {
  const now = useNow()
  const running = jobs.find((j) => j.status === 'imprimindo')
  const [order, setOrder] = useState<string[]>(() => jobs.filter((j) => j.status === 'na_fila').map((j) => j.id))
  const serverOrder = jobs
    .filter((j) => j.status === 'na_fila')
    .map((j) => j.id)
    .join(',')
  useEffect(() => setOrder(serverOrder ? serverOrder.split(',') : []), [serverOrder])

  const byId = new Map(jobs.map((j) => [j.id, j]))
  const queued = order.map((id) => byId.get(id)).filter(Boolean) as JobRow[]
  const plan = schedule(running, queued, now)

  // consumo acumulado por carretel ao longo da fila: avisa antes de faltar filamento
  const shortage = useMemo(() => {
    const left = new Map(filaments.map((f) => [f.id, Number(f.remaining_g)]))
    const out = new Set<string>()
    for (const j of [running, ...queued]) {
      if (!j?.filament_id || !left.has(j.filament_id)) continue
      const rest = left.get(j.filament_id)! - Number(j.grams)
      left.set(j.filament_id, rest)
      if (rest < 0) out.add(j.id)
    }
    return out
  }, [filaments, running, queued])

  const reorder = useAction(async (ids: string[]) => must(await supabase.rpc('reorder_print_jobs', { p_ids: ids })), { invalidate: [keys.jobs] })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return
    const next = arrayMove(order, from, to)
    setOrder(next)
    reorder.mutate(next)
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    move(order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id)))
  }

  if (!running && !queued.length) {
    return (
      <>
        <EmptyState
          icon={<QueueIcon />}
          title={`${printerName} livre`}
          action={
            <Button variant="primary" onClick={onAdd}>
              <Plus /> Adicionar placa
            </Button>
          }
        >
          Ao mandar um pedido para "Na fila", as placas aparecem aqui. Também dá para adicionar placas avulsas.
        </EmptyState>
        <DoneList done={done} />
      </>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <AnimatePresence mode="popLayout" initial={false}>
        {plan.current ? (
          <m.div key={plan.current.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={spring}>
            <RunningCard job={plan.current as Scheduled<JobRow>} now={now} filament={filaments.find((f) => f.id === plan.current!.filament_id)} short={shortage.has(plan.current.id)} />
          </m.div>
        ) : (
          <div className="flex items-center gap-3 rounded-ui border border-dashed border-border-strong px-4 py-3 text-sm text-fg-muted">
            <PrinterIcon className="size-5 text-fg-subtle" />
            {printerName} parada. Toque em <Play className="inline size-4" weight="fill" /> na próxima placa para começar.
          </div>
        )}
        </AnimatePresence>

        {queued.length > 0 && (
          <section aria-label="Próximas placas">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold text-fg-muted">
                Na fila <span className="num text-fg-subtle">{queued.length}</span>
              </h2>
              <span className="num text-xs text-fg-subtle">termina {relativeDateTime(new Date(plan.endsAt)).toLowerCase()}</span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <ol className="flex flex-col gap-2">
                  {plan.queue.map((j, i) => (
                    <QueueRow
                      key={j.id}
                      job={j as Scheduled<JobRow>}
                      index={i}
                      count={queued.length}
                      canStart={!running}
                      filament={filaments.find((f) => f.id === j.filament_id)}
                      short={shortage.has(j.id)}
                      onMove={move}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          </section>
        )}
      </div>
      <DoneList done={done} />
    </div>
  )
}

function JobMeta({ job, filament }: { job: JobRow; filament?: Filament }) {
  return (
    <p className="num mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted">
      {job.order ? (
        <Link to={`/pedidos/${job.order.id}`} className="font-medium text-fg hover:underline" onPointerDown={(e) => e.stopPropagation()}>
          {docNumber(job.order.number)}
          {job.order.customer && <span className="font-normal text-fg-muted"> · {job.order.customer.name}</span>}
        </Link>
      ) : (
        <span>Avulsa</span>
      )}
      {filament && (
        <span className="inline-flex items-center gap-1">
          <ColorSwatch hex={filament.color_hex} className="size-3" />
          {filament.material} {filament.color_name}
        </span>
      )}
      <span>{grams(Number(job.grams))}</span>
    </p>
  )
}

function RunningCard({ job, now, filament, short }: { job: Scheduled<JobRow>; now: number; filament?: Filament; short: boolean }) {
  const [failing, setFailing] = useState(false)
  const total = job.print_minutes * 60_000
  const elapsed = Math.max(0, now - job.startAt)
  const pct = total ? Math.min(100, (elapsed / total) * 100) : 100
  const late = now > job.startAt + total
  const complete = useAction(async () => must(await supabase.rpc('complete_print_job', { p_job_id: job.id })), {
    invalidate: [keys.jobs, keys.filaments, keys.orders],
    success: `Placa concluída. ${grams(Number(job.grams))} descontados do carretel.`,
  })

  return (
    <Card className="overflow-hidden border-[color-mix(in_srgb,var(--st-imprimindo)_40%,var(--border))]">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <PrintStage
          progress={jobProgress(job.startAt, job.print_minutes, now)}
          piece={pieceFor(job.id)}
          color={filament?.color_hex}
          sceneClassName="print-fade-card"
          className="h-40 border-b border-border sm:order-last sm:h-auto sm:border-b-0 sm:border-l"
        />
        <div className="min-w-0 p-4">
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--st-imprimindo)' }}>
            <span className="size-2 animate-pulse rounded-full" style={{ background: 'var(--st-imprimindo)' }} />
            Imprimindo agora
          </div>
          <h2 className="mt-1.5 text-lg font-semibold">{job.title}</h2>
          <JobMeta job={job} filament={filament} />
          <div className="mt-4">
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-3"
              role="progressbar"
              aria-label="Progresso estimado"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <ProgressFill pct={pct} className="h-full rounded-full" style={{ background: 'var(--st-imprimindo)' }} />
            </div>
            <div className="num mt-1.5 flex justify-between text-xs text-fg-muted">
              <span>
                {duration(elapsed / 60_000)} de {duration(job.print_minutes)}
              </span>
              <span className={late ? 'text-warn' : ''}>{late ? 'Já devia ter terminado' : `Termina ${relativeDateTime(new Date(job.endAt)).toLowerCase()}`}</span>
            </div>
          </div>
          {short && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-accent-text">
              <Warning weight="fill" /> O carretel pode não ter filamento suficiente.
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border bg-surface-2/40 p-3">
        <Button variant="primary" onClick={() => complete.mutate(undefined)} loading={complete.isPending}>
          <CheckCircle /> Concluir
        </Button>
        <Button onClick={() => setFailing(true)}>
          <WarningOctagon /> Falhou
        </Button>
      </div>
      {failing && <FailDialog job={job} onClose={() => setFailing(false)} />}
    </Card>
  )
}

function QueueRow({
  job,
  index,
  count,
  canStart,
  filament,
  short,
  onMove,
}: {
  job: Scheduled<JobRow>
  index: number
  count: number
  canStart: boolean
  filament?: Filament
  short: boolean
  onMove: (from: number, to: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const [editing, setEditing] = useState(false)
  const [failing, setFailing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const start = useAction(async () => must(await supabase.rpc('start_print_job', { p_job_id: job.id })), {
    invalidate: [keys.jobs, keys.orders],
    success: 'Impressão iniciada',
  })
  const complete = useAction(async () => must(await supabase.rpc('complete_print_job', { p_job_id: job.id })), {
    invalidate: [keys.jobs, keys.filaments, keys.orders],
    success: 'Placa concluída',
  })
  const remove = useAction(async () => must(await supabase.from('print_jobs').update({ status: 'cancelada' }).eq('id', job.id)), {
    invalidate: [keys.jobs, keys.orders],
    success: 'Placa removida da fila',
    onSuccess: () => setRemoving(false),
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10')}
    >
      <Card className={cn('flex items-center gap-2 py-2.5 pr-2 pl-1', isDragging && 'shadow-[var(--shadow)] ring-1 ring-border-strong')}>
        <button
          type="button"
          className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-fg-subtle active:cursor-grabbing"
          aria-label={`Arrastar ${job.title}`}
          {...attributes}
          {...listeners}
        >
          <DotsSixVertical className="size-5" weight="bold" />
        </button>
        <span className="num w-5 shrink-0 text-center text-sm text-fg-subtle">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{job.title}</p>
          <JobMeta job={job} filament={filament} />
          <p className="num mt-0.5 text-xs text-fg-subtle">
            {duration(job.print_minutes)} · {relativeDateTime(new Date(job.startAt))} até {relativeDateTime(new Date(job.endAt)).replace(/^(Hoje|Amanhã) /, '')}
          </p>
          {short && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-accent-text">
              <Warning weight="fill" className="size-3.5" /> Filamento pode faltar ({filament && filamentLabel(filament)})
            </p>
          )}
        </div>
        {canStart && index === 0 && (
          <Button variant="secondary" size="icon" aria-label={`Iniciar ${job.title}`} onClick={() => start.mutate(undefined)} loading={start.isPending}>
            <Play weight="fill" />
          </Button>
        )}
        <Menu>
          <MenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações de ${job.title}`}>
              <DotsThreeVertical weight="bold" />
            </Button>
          </MenuTrigger>
          <MenuContent>
            {canStart && (
              <MenuItem onSelect={() => start.mutate(undefined)}>
                <Play /> Iniciar agora
              </MenuItem>
            )}
            <MenuItem onSelect={() => complete.mutate(undefined)}>
              <CheckCircle /> Marcar como concluída
            </MenuItem>
            <MenuItem onSelect={() => setFailing(true)}>
              <WarningOctagon /> Registrar falha
            </MenuItem>
            <MenuSeparator />
            <MenuItem disabled={index === 0} onSelect={() => onMove(index, index - 1)}>
              <ArrowUp /> Subir
            </MenuItem>
            <MenuItem disabled={index === count - 1} onSelect={() => onMove(index, index + 1)}>
              <ArrowDown /> Descer
            </MenuItem>
            <MenuItem onSelect={() => setEditing(true)}>
              <PencilSimple /> Editar
            </MenuItem>
            <MenuItem danger onSelect={() => setRemoving(true)}>
              <Trash /> Tirar da fila
            </MenuItem>
          </MenuContent>
        </Menu>
      </Card>
      {editing && <JobDialog job={job} onClose={() => setEditing(false)} />}
      {failing && <FailDialog job={job} onClose={() => setFailing(false)} />}
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title="Tirar placa da fila?"
        description="A placa é cancelada. O pedido continua como está."
        confirmLabel="Tirar da fila"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
      />
    </li>
  )
}

function DoneList({ done }: { done: JobRow[] }) {
  if (!done.length) return null
  return (
    <section aria-label="Concluídas recentemente" className="mt-4 lg:mt-0">
      <h2 className="mb-2 px-1 text-sm font-semibold text-fg-muted">Concluídas recentemente</h2>
      <Card className="divide-y divide-border">
        {done.map((j) => (
          <div key={j.id} className="flex items-center gap-3 px-3 py-2.5">
            <CheckCircle className="size-5 shrink-0 text-ok" weight="fill" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{j.title}</p>
              <p className="num text-xs text-fg-subtle">
                {j.order ? `${docNumber(j.order.number)} · ` : ''}
                {j.finished_at && dateTime(j.finished_at)}
              </p>
            </div>
            <span className="num text-xs text-fg-muted">{grams(Number(j.deducted_g ?? j.grams))}</span>
          </div>
        ))}
      </Card>
    </section>
  )
}
