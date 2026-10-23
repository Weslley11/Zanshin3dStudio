import { Dialog as D, AlertDialog as AD } from 'radix-ui'
import type { ReactNode } from 'react'
import { AnimatePresence, m, useDragControls, type PanInfo } from 'motion/react'
import { X } from '@phosphor-icons/react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ease, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Button } from './button'

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
}

/** Fecha a folha quando ela é puxada para baixo o bastante (ou com um peteleco). */
function shouldClose(info: PanInfo) {
  return info.offset.y > 110 || info.velocity.y > 600
}

/**
 * No celular abre como folha de baixo para cima (fácil de alcançar com o
 * polegar) e fecha arrastando a alça para baixo; no desktop, centralizado.
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
  const mobile = useMediaQuery('(max-width: 639px)')
  const drag = useDragControls()

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <m.div {...overlayMotion} className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px]" />
            </D.Overlay>
            <D.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => {
                // no celular, não abrir o teclado sozinho
                if (window.matchMedia('(pointer: coarse)').matches) e.preventDefault()
              }}
            >
              <m.div
                className={cn(
                  'fixed z-50 flex flex-col border border-border bg-surface shadow-[var(--shadow)] outline-none',
                  mobile
                    ? 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-ui'
                    : cn('top-1/2 left-1/2 max-h-[88dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-ui', wide ? 'max-w-2xl' : 'max-w-lg'),
                )}
                {...(mobile
                  ? {
                      initial: { y: '100%' },
                      animate: { y: 0 },
                      exit: { y: '100%' },
                      transition: spring,
                      drag: 'y' as const,
                      dragListener: false,
                      dragControls: drag,
                      dragConstraints: { top: 0, bottom: 0 },
                      dragElastic: { top: 0, bottom: 0.7 },
                      onDragEnd: (_: unknown, info: PanInfo) => shouldClose(info) && onOpenChange(false),
                    }
                  : {
                      initial: { opacity: 0, scale: 0.96 },
                      animate: { opacity: 1, scale: 1 },
                      exit: { opacity: 0, scale: 0.97 },
                      transition: { duration: 0.2, ease },
                    })}
              >
                {/* alça e cabeçalho: área de arrastar no celular */}
                <div className="touch-none" onPointerDown={(e) => mobile && drag.start(e)}>
                  {mobile && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" aria-hidden />}
                  <div className="flex items-start justify-between gap-4 border-b border-border px-5 pt-3 pb-3 sm:pt-4">
                    <div>
                      <D.Title className="text-lg font-semibold">{title}</D.Title>
                      {description ? (
                        <D.Description className="mt-0.5 text-sm text-fg-muted">{description}</D.Description>
                      ) : (
                        <D.Description className="sr-only">{typeof title === 'string' ? title : 'Formulário'}</D.Description>
                      )}
                    </div>
                    <D.Close asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Fechar" className="-mr-2" onPointerDown={(e) => e.stopPropagation()}>
                        <X />
                      </Button>
                    </D.Close>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
                {footer && <div className="pb-safe flex flex-col-reverse gap-2 border-t border-border px-5 py-3 sm:flex-row sm:justify-end">{footer}</div>}
              </m.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  )
}

/** Folha simples de baixo para cima (menu "Mais"), também fecha arrastando. */
export function BottomSheet({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; children: ReactNode }) {
  const drag = useDragControls()
  return (
    <AnimatePresence>
      {open && (
        <D.Portal forceMount>
          <D.Overlay asChild forceMount>
            <m.div {...overlayMotion} className="fixed inset-0 z-50 bg-[var(--overlay)]" />
          </D.Overlay>
          <D.Content asChild forceMount>
            <m.div
              className="pb-safe fixed inset-x-0 bottom-0 z-50 rounded-t-ui border-t border-border bg-surface px-3 pt-3 outline-none"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={spring}
              drag="y"
              dragListener={false}
              dragControls={drag}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_, info) => shouldClose(info) && onOpenChange(false)}
            >
              <div className="-mx-3 -mt-3 touch-none px-3 pt-3 pb-3" onPointerDown={(e) => drag.start(e)}>
                <div className="mx-auto h-1 w-10 rounded-full bg-border-strong" aria-hidden />
              </div>
              <D.Title className="sr-only">{title}</D.Title>
              <D.Description className="sr-only">{description}</D.Description>
              {children}
            </m.div>
          </D.Content>
        </D.Portal>
      )}
    </AnimatePresence>
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
      <AnimatePresence>
        {open && (
          <AD.Portal forceMount>
            <AD.Overlay asChild forceMount>
              <m.div {...overlayMotion} className="fixed inset-0 z-50 bg-[var(--overlay)]" />
            </AD.Overlay>
            <AD.Content asChild forceMount>
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, ease }}
                className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-ui border border-border bg-surface p-5 shadow-[var(--shadow)]"
              >
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
              </m.div>
            </AD.Content>
          </AD.Portal>
        )}
      </AnimatePresence>
    </AD.Root>
  )
}
