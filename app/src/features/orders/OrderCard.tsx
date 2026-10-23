import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS_LABEL, nextStatus, type OrderStatus } from '@/lib/constants'
import { brl, docNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderListRow } from './api'
import { DueChip } from './DueChip'

export function OrderCard({
  order,
  onAdvance,
  advancing,
  dragging,
  className,
}: {
  order: OrderListRow
  onAdvance?: (to: OrderStatus) => void
  advancing?: boolean
  dragging?: boolean
  className?: string
}) {
  const status = order.status as OrderStatus
  const next = nextStatus(status)
  const remaining = Number(order.total) - Number(order.paid_total)
  return (
    <div
      className={cn(
        'rounded-ui border border-border bg-surface p-3 transition-shadow',
        dragging && 'rotate-1 shadow-[var(--shadow)] ring-1 ring-border-strong',
        className,
      )}
    >
      <Link to={`/pedidos/${order.id}`} className="block focus-visible:outline-none" draggable={false}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="num text-sm font-semibold whitespace-nowrap">{docNumber(order.number)}</span>
          <span className="num text-sm font-medium whitespace-nowrap">{brl(Number(order.total))}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-fg-muted">{order.customer?.name ?? 'Sem cliente'}</p>
        <p className="mt-1 line-clamp-2 text-xs text-fg-subtle">
          {order.items.map((i) => (i.quantity > 1 ? `${i.quantity}x ${i.description}` : i.description)).join(', ')}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <DueChip due={order.due_date} status={status} />
          {remaining > 0.009 && status !== 'cancelado' && <span className="num text-xs text-fg-muted">falta {brl(remaining)}</span>}
        </div>
      </Link>
      {onAdvance && next && (
        <Button size="sm" variant="secondary" className="mt-3 w-full" loading={advancing} onClick={() => onAdvance(next)}>
          {ORDER_STATUS_LABEL[next]} <ArrowRight />
        </Button>
      )}
    </div>
  )
}
