import { CalendarBlank } from '@phosphor-icons/react'
import { date } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dueInfo } from './due'

export function DueChip({ due, status, withDate }: { due: string | null; status: string; withDate?: boolean }) {
  const info = dueInfo(due, status)
  if (!due) return null
  return (
    <span
      className={cn(
        'num inline-flex items-center gap-1 text-xs font-medium',
        info?.tone === 'late' ? 'text-accent-text' : info?.tone === 'soon' ? 'text-warn' : 'text-fg-muted',
      )}
      title={`Prazo ${date(due)}`}
    >
      <CalendarBlank className="size-3.5" weight={info?.tone === 'late' ? 'fill' : 'regular'} />
      {withDate || !info ? date(due) : info.label}
      {withDate && info && info.tone !== 'ok' && <span>· {info.label}</span>}
    </span>
  )
}
