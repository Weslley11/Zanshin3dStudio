import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CaretRight, Kanban, ListBullets, MagnifyingGlass, Package, Plus } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'
import { Card, Segmented, StatusBadge } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/constants'
import { brl, daysUntil, docNumber, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useOrders, useSetOrderStatus, type OrderListRow } from './api'
import { DueChip } from './DueChip'
import { dueInfo } from './due'
import { OrderCard } from './OrderCard'

type View = 'quadro' | 'lista'

function useStoredView(): [View, (v: View) => void] {
  const [v, setV] = useState<View>(() => {
    try {
      return (localStorage.getItem('zanshin-pedidos-view') as View) || 'quadro'
    } catch {
      return 'quadro'
    }
  })
  return [
    v,
    (nv) => {
      try {
        localStorage.setItem('zanshin-pedidos-view', nv)
      } catch {
        /* sem armazenamento: vale só agora */
      }
      setV(nv)
    },
  ]
}

/** Entregues aparecem no quadro só por 30 dias; depois ficam na lista. */
function onBoard(o: OrderListRow) {
  if (o.status === 'cancelado') return false
  if (o.status === 'entregue') return !o.delivered_at || daysUntil(o.delivered_at.slice(0, 10), todayISO()) > -30
  return true
}

export function OrdersPage() {
  const orders = useOrders()
  const [view, setView] = useStoredView()

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Da aprovação até a entrega."
        actions={
          <>
            <Segmented<View>
              label="Visão"
              value={view}
              onChange={setView}
              options={[
                { value: 'quadro', label: <><Kanban /> <span className="hidden sm:inline">Quadro</span></> },
                { value: 'lista', label: <><ListBullets /> <span className="hidden sm:inline">Lista</span></> },
              ]}
            />
            <Button asChild variant="primary" className="hidden sm:inline-flex">
              <Link to="/orcamentos/novo">
                <Plus /> Novo
              </Link>
            </Button>
          </>
        }
      />
      <Page className="max-w-none lg:max-w-none">
        {orders.isPending ? (
          <div className="grid gap-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <ListSkeleton key={i} rows={2} height="h-28" />
            ))}
          </div>
        ) : orders.error ? (
          <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
        ) : !orders.data.length ? (
          <div className="mx-auto max-w-6xl">
            <EmptyState
              icon={<Package />}
              title="Nenhum pedido ainda"
              action={
                <Button asChild variant="primary">
                  <Link to="/orcamentos">Ir para orçamentos</Link>
                </Button>
              }
            >
              Pedidos nascem de orçamentos aprovados. Abra um orçamento e toque em "Aprovado: criar pedido".
            </EmptyState>
          </div>
        ) : view === 'quadro' ? (
          <Board orders={orders.data} />
        ) : (
          <div className="mx-auto max-w-6xl">
            <OrderList orders={orders.data} />
          </div>
        )}
      </Page>
    </>
  )
}

function Board({ orders }: { orders: OrderListRow[] }) {
  const desktop = useMediaQuery('(min-width: 1024px) and (pointer: fine)')
  const setStatus = useSetOrderStatus()
  const [tab, setTab] = useState<OrderStatus>(() => {
    const firstWithOrders = ORDER_STATUSES.find((s) => orders.some((o) => o.status === s))
    return firstWithOrders ?? 'aprovado'
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  // atualização otimista: o card muda de coluna na hora
  const [moved, setMoved] = useState<Record<string, OrderStatus>>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))

  const list = orders.filter(onBoard).map((o) => (moved[o.id] && moved[o.id] !== o.status ? { ...o, status: moved[o.id] } : o))
  const byStatus = (s: OrderStatus) =>
    list
      .filter((o) => o.status === s)
      .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || a.number - b.number)

  function move(id: string, to: OrderStatus) {
    setMoved((m) => ({ ...m, [id]: to }))
    setStatus.mutate({ id, status: to }, { onError: () => setMoved((m) => ({ ...m, [id]: undefined as unknown as OrderStatus })) })
  }

  if (!desktop) {
    // celular: uma coluna por vez, com botão de avançar
    return (
      <div>
        <div className="scrollbar-none -mx-4 mb-3 overflow-x-auto px-4">
          <Segmented<OrderStatus>
            label="Status"
            value={tab}
            onChange={setTab}
            options={ORDER_STATUSES.map((s) => ({
              value: s,
              label: (
                <>
                  {ORDER_STATUS_LABEL[s]} <span className="num text-fg-subtle">{byStatus(s).length}</span>
                </>
              ),
            }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          {byStatus(tab).map((o) => (
            <OrderCard key={o.id} order={o} onAdvance={(to) => move(o.id, to)} advancing={setStatus.isPending && setStatus.variables?.id === o.id} />
          ))}
          {!byStatus(tab).length && <p className="py-10 text-center text-sm text-fg-muted">Nenhum pedido em "{ORDER_STATUS_LABEL[tab]}".</p>}
        </div>
      </div>
    )
  }

  const active = list.find((o) => o.id === activeId)
  return (
    <DndContext
      sensors={sensors}
      // coluna sob o ponteiro; no teclado, a que mais se sobrepõe
      collisionDetection={(args) => (args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args))}
      // sem rolagem lateral automática: o quadro cabe na tela
      autoScroll={{ threshold: { x: 0, y: 0.15 } }}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={(e: DragEndEvent) => {
        setActiveId(null)
        const to = e.over?.id as OrderStatus | undefined
        const o = list.find((x) => x.id === e.active.id)
        if (o && to && to !== o.status) move(o.id, to)
      }}
    >
      <div className="grid grid-cols-6 gap-3">
        {ORDER_STATUSES.map((s) => (
          <Column key={s} status={s} count={byStatus(s).length}>
            {byStatus(s).map((o) => (
              <DraggableCard key={o.id} order={o} hidden={o.id === activeId} />
            ))}
          </Column>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {active && <OrderCard order={active} dragging />}
      </DragOverlay>
    </DndContext>
  )
}

function Column({ status, count, children }: { status: OrderStatus; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      aria-label={ORDER_STATUS_LABEL[status]}
      className={cn('flex min-h-[60vh] min-w-0 flex-col gap-2 rounded-ui border border-transparent bg-surface-2/40 p-2 transition-colors', isOver && 'border-border-strong bg-surface-2')}
    >
      <header className="flex items-center justify-between px-1 pt-1 pb-1.5">
        <StatusBadge status={status} className="border-0 bg-transparent px-0" />
        <span className="num text-xs text-fg-subtle">{count}</span>
      </header>
      {children}
    </section>
  )
}

function DraggableCard({ order, hidden }: { order: OrderListRow; hidden: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: order.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn('cursor-grab touch-none active:cursor-grabbing', hidden && 'opacity-30')} aria-roledescription="pedido arrastável">
      <OrderCard order={order} />
    </div>
  )
}

type StatusFilter = 'ativos' | OrderStatus | 'todos'
type DueFilter = '' | 'atrasados' | 'proximos'

function OrderList({ orders }: { orders: OrderListRow[] }) {
  const [status, setStatus] = useState<StatusFilter>('ativos')
  const [due, setDue] = useState<DueFilter>('')
  const [payment, setPayment] = useState('')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return orders
      .filter((o) => {
        if (status === 'ativos' && ['entregue', 'cancelado'].includes(o.status)) return false
        if (status !== 'ativos' && status !== 'todos' && o.status !== status) return false
        const info = dueInfo(o.due_date, o.status)
        if (due === 'atrasados' && info?.tone !== 'late') return false
        if (due === 'proximos' && !(info && info.days >= 0 && info.days <= 3)) return false
        const remaining = Number(o.total) - Number(o.paid_total)
        if (payment === 'pendente' && remaining <= 0.009) return false
        if (payment === 'quitado' && remaining > 0.009) return false
        if (!t) return true
        return docNumber(o.number).toLowerCase().includes(t) || o.customer?.name.toLowerCase().includes(t) || o.items.some((i) => i.description.toLowerCase().includes(t))
      })
      .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || b.number - a.number)
  }, [orders, status, due, payment, q])

  return (
    <>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input aria-label="Buscar pedido" placeholder="Número, cliente ou peça" className="pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:contents">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="ativos">Em andamento</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
            <option value="cancelado">Cancelados</option>
            <option value="todos">Todos</option>
          </Select>
          <Select aria-label="Prazo" value={due} onChange={(e) => setDue(e.target.value as DueFilter)}>
            <option value="">Qualquer prazo</option>
            <option value="atrasados">Atrasados</option>
            <option value="proximos">Próximos 3 dias</option>
          </Select>
          <Select aria-label="Pagamento" value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">Pagamento</option>
            <option value="pendente">Falta receber</option>
            <option value="quitado">Quitados</option>
          </Select>
        </div>
      </div>
      {!list.length ? (
        <p className="py-10 text-center text-sm text-fg-muted">Nenhum pedido com esses filtros.</p>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {list.map((o) => {
            const remaining = Number(o.total) - Number(o.paid_total)
            return (
              <Link key={o.id} to={`/pedidos/${o.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="num font-medium">{docNumber(o.number)}</span>
                    <span className="truncate text-fg-muted">{o.customer?.name ?? 'Sem cliente'}</span>
                    <StatusBadge status={o.status as OrderStatus} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-fg-subtle">{o.items.map((i) => i.description).join(', ')}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="num text-sm font-semibold">{brl(Number(o.total))}</span>
                  {remaining > 0.009 && o.status !== 'cancelado' ? (
                    <span className="num text-xs text-warn">falta {brl(remaining)}</span>
                  ) : (
                    <DueChip due={o.due_date} status={o.status} />
                  )}
                </div>
                <CaretRight className="size-4 text-fg-subtle" />
              </Link>
            )
          })}
        </Card>
      )}
    </>
  )
}
