import type { ReactNode } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { errorMessage } from '@/lib/supabase'
import { Button } from './button'
import { Skeleton } from './misc'

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="animate-enter flex flex-col items-center rounded-ui border border-dashed border-border-strong px-6 py-10 text-center">
      <div className="mb-3 text-fg-subtle [&_svg]:size-9">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-sm text-fg-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-ui border border-border bg-surface px-6 py-8 text-center">
      <WarningCircle className="mb-2 size-8 text-danger" />
      <h3 className="font-semibold">Não deu para carregar</h3>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">{errorMessage(error)}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  )
}

export function ListSkeleton({ rows = 4, height = 'h-16' }: { rows?: number; height?: string }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={height} />
      ))}
    </div>
  )
}
