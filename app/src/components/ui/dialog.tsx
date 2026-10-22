import { Dialog as D, AlertDialog as AD } from 'radix-ui'
import type { ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './button'

/**
 * No celular abre como folha de baixo para cima (fácil de alcançar com o
 * polegar); no desktop, centralizado.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="animate-fade fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px]" />
        <D.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-ui border border-border bg-surface shadow-[var(--shadow)] outline-none',
            'animate-[sheet-up_240ms_var(--ease-out)] sm:animate-enter',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-ui',
            wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          )}
          onOpenAutoFocus={(e) => {
            // no celular, não abrir o teclado sozinho
            if (window.matchMedia('(pointer: coarse)').matches) e.preventDefault()
          }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 pt-4 pb-3">
            <div>
              <D.Title className="text-lg font-semibold">{title}</D.Title>
              {description ? (
                <D.Description className="mt-0.5 text-sm text-fg-muted">{description}</D.Description>
              ) : (
                <D.Description className="sr-only">{typeof title === 'string' ? title : 'Formulário'}</D.Description>
              )}
            </div>
            <D.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Fechar" className="-mr-2">
                <X />
              </Button>
            </D.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="pb-safe flex flex-col-reverse gap-2 border-t border-border px-5 py-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  danger,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  danger?: boolean
  loading?: boolean
}) {
  return (
    <AD.Root open={open} onOpenChange={onOpenChange}>
      <AD.Portal>
        <AD.Overlay className="animate-fade fixed inset-0 z-50 bg-[var(--overlay)]" />
        <AD.Content className="animate-enter fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-ui border border-border bg-surface p-5 shadow-[var(--shadow)]">
          <AD.Title className="text-lg font-semibold">{title}</AD.Title>
          <AD.Description className="mt-2 text-sm text-fg-muted">{description}</AD.Description>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AD.Cancel asChild>
              <Button variant="ghost">Voltar</Button>
            </AD.Cancel>
            <Button
              variant={danger ? 'danger' : 'primary'}
              loading={loading}
              onClick={(e) => {
                e.preventDefault()
                onConfirm()
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AD.Content>
      </AD.Portal>
    </AD.Root>
  )
}
