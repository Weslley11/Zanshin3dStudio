import type { ComponentProps, ReactNode } from 'react'
import { DropdownMenu as DM } from 'radix-ui'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/constants'
import { ORDER_STATUS_LABEL } from '@/lib/constants'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-ui border border-border bg-surface', className)} {...props} />
}

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('skeleton rounded-ui', className)} aria-hidden {...props} />
}

export function Badge({ className, tone = 'neutral', ...props }: ComponentProps<'span'> & { tone?: 'neutral' | 'accent' | 'warn' | 'ok' }) {
  const tones = {
    neutral: 'border-border-strong text-fg-muted',
    accent: 'border-accent/40 bg-accent-soft text-accent-text',
    warn: 'border-[var(--warn)]/40 text-warn',
    ok: 'border-[var(--ok)]/40 text-ok',
  }
  return (
    <span
      className={cn('inline-flex h-6 items-center gap-1.5 rounded-ui border px-2 text-xs font-medium whitespace-nowrap', tones[tone], className)}
      {...props}
    />
  )
}

/** Status de pedido: ponto colorido discreto + texto, mesma cor em todo o app. */
export function StatusBadge({ status, className, pulse }: { status: OrderStatus; className?: string; pulse?: boolean }) {
  const color = `var(--st-${status})`
  return (
    <span
      className={cn('inline-flex h-6 items-center gap-1.5 rounded-ui border px-2 text-xs font-medium whitespace-nowrap', className)}
      style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 9%, transparent)` }}
    >
      <span className={cn('size-1.5 rounded-full', pulse && status === 'imprimindo' && 'animate-pulse')} style={{ background: color }} />
      {ORDER_STATUS_LABEL[status]}
    </span>
  )
}

export function ColorSwatch({ hex, className, label }: { hex: string; className?: string; label?: string }) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-block size-5 shrink-0 rounded-full border border-border-strong shadow-[inset_0_-2px_4px_rgb(0_0_0/0.25)]', className)}
      style={{ background: hex }}
    />
  )
}

/** Controle segmentado (filtros curtos, escolha de tema, visão quadro/lista) */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-ui border border-border bg-surface p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-ui px-3 text-sm whitespace-nowrap text-fg-muted transition-colors [&_svg]:size-4',
            value === o.value ? 'bg-surface-3 text-fg' : 'hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-xs font-medium tracking-wide text-fg-subtle uppercase">{label}</span>
      <span className="num text-2xl font-semibold tracking-tight">{value}</span>
      {hint && <span className="text-xs text-fg-muted">{hint}</span>}
    </div>
  )
}

export const Menu = DM.Root
export const MenuTrigger = DM.Trigger
export function MenuContent({ className, ...props }: ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        align="end"
        sideOffset={6}
        className={cn('animate-fade z-50 min-w-48 rounded-ui border border-border bg-surface p-1 shadow-[var(--shadow)]', className)}
        {...props}
      />
    </DM.Portal>
  )
}
export function MenuItem({ className, danger, ...props }: ComponentProps<typeof DM.Item> & { danger?: boolean }) {
  return (
    <DM.Item
      className={cn(
        'flex h-10 cursor-pointer items-center gap-2.5 rounded-ui px-2.5 text-sm outline-none select-none data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-fg-muted',
        danger && 'text-danger [&_svg]:text-danger',
        className,
      )}
      {...props}
    />
  )
}
export const MenuSeparator = () => <DM.Separator className="my-1 h-px bg-border" />
