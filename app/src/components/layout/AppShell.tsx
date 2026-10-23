import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { m } from 'motion/react'
import { ease, spring } from '@/lib/motion'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Calculator,
  ChartLineUp,
  Cube,
  CubeFocus,
  Disc,
  DotsThreeOutline,
  GearSix,
  House,
  Package,
  Queue,
  SignOut,
  Users,
  WifiSlash,
} from '@phosphor-icons/react'
import { Dialog as D } from 'radix-ui'
import { useOnline } from '@/hooks/useOnline'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { BottomSheet } from '@/components/ui/dialog'
import { Logo } from './Logo'
import { ThemeSwitcher } from './ThemeSwitcher'

type NavItem = { to: string; label: string; icon: typeof House; end?: boolean }

const MAIN: NavItem[] = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/orcamentos', label: 'Orçamentos', icon: Calculator },
  { to: '/pedidos', label: 'Pedidos', icon: Package },
  { to: '/fila', label: 'Fila', icon: Queue },
]
const MORE: NavItem[] = [
  { to: '/filamentos', label: 'Filamentos', icon: Disc },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogo', label: 'Catálogo', icon: Cube },
  { to: '/modelos', label: 'Modelos 3D', icon: CubeFocus },
  { to: '/financeiro', label: 'Financeiro', icon: ChartLineUp },
  { to: '/configuracoes', label: 'Configurações', icon: GearSix },
]

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'group relative flex h-10 items-center gap-3 rounded-ui px-3 text-sm font-medium transition-colors',
          isActive ? 'text-fg' : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <m.span layoutId="side-active" className="absolute inset-0 rounded-ui bg-surface-2" transition={spring}>
              <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent" />
            </m.span>
          )}
          <Icon className="relative size-5" weight={isActive ? 'fill' : 'regular'} />
          <span className="relative">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function TabLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn('flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px] font-medium', isActive ? 'text-fg' : 'text-fg-subtle')
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative flex h-7 w-12 items-center justify-center">
            {isActive && <m.span layoutId="tab-active" className="absolute inset-0 rounded-full bg-accent-soft" transition={spring} />}
            <Icon className={cn('relative size-6', isActive && 'text-accent-text')} weight={isActive ? 'fill' : 'regular'} />
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const moreActive = MORE.some((m) => location.pathname.startsWith(m.to))
  const online = useOnline()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      {/* desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
        <Logo className="mb-7 px-2" />
        <nav className="flex flex-col gap-0.5" aria-label="Principal">
          {MAIN.map((i) => (
            <SideLink key={i.to} item={i} />
          ))}
          <div className="my-3 h-px bg-border" />
          {MORE.map((i) => (
            <SideLink key={i.to} item={i} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-1">
          <ThemeSwitcher />
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex h-9 items-center gap-2 rounded-ui px-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <SignOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 overflow-x-clip pb-24 lg:pb-10">
        {!online && (
          <div role="status" className="animate-fade sticky top-0 z-40 flex items-center justify-center gap-2 bg-surface-3 px-4 py-2 text-sm text-fg">
            <WifiSlash className="size-4" /> Sem internet. Os dados voltam a carregar quando a conexão voltar.
          </div>
        )}
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10"><div className="skeleton h-24 rounded-ui" /></div>}>
          <RouteTransition />
        </Suspense>
      </main>

      {/* celular */}
      <nav
        aria-label="Principal"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
      >
        {MAIN.map((i) => (
          <TabLink key={i.to} item={i} />
        ))}
        <D.Root open={moreOpen} onOpenChange={setMoreOpen}>
          <D.Trigger
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px] font-medium',
              moreActive ? 'text-fg' : 'text-fg-subtle',
            )}
          >
            <DotsThreeOutline className={cn('size-6', moreActive && 'text-accent-text')} weight={moreActive ? 'fill' : 'regular'} />
            Mais
          </D.Trigger>
          <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="Mais seções" description="Filamentos, clientes, catálogo, modelos, financeiro e configurações">
            <div className="flex flex-col gap-0.5" onClick={() => setMoreOpen(false)}>
              {MORE.map((i) => (
                <MoreLink key={i.to} item={i} />
              ))}
            </div>
            <div className="my-3 h-px bg-border" />
            <div className="flex items-center justify-between gap-3 px-1 pb-4">
              <ThemeSwitcher />
              <button onClick={() => supabase.auth.signOut()} className="flex h-10 items-center gap-2 rounded-ui px-3 text-sm text-fg-muted">
                <SignOut className="size-4" /> Sair
              </button>
            </div>
          </BottomSheet>
        </D.Root>
      </nav>
    </div>
  )
}

function MoreLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn('flex h-12 items-center gap-3 rounded-ui px-3 text-[15px] font-medium', isActive ? 'bg-surface-2 text-fg' : 'text-fg-muted')
      }
    >
      <Icon className="size-5" />
      {item.label}
    </NavLink>
  )
}

/** Cabeçalho de página: título, descrição curta e ações à direita. */
export function PageHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 lg:px-8 lg:pt-8 lg:pb-2">
        {back}
        <div className="min-w-0 flex-1">
          <h1 className="title-display truncate text-xl lg:text-2xl">{title}</h1>
          {description && <p className="mt-0.5 hidden text-sm text-fg-muted sm:block">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-6xl px-4 py-4 lg:px-8 lg:py-6', className)}>{children}</div>
}

/**
 * Troca de tela: entrar num detalhe (/pedidos → /pedidos/123) desliza da
 * direita, voltar desliza da esquerda, trocar de seção só aparece.
 */
function RouteTransition() {
  const { pathname } = useLocation()
  const depth = pathname.split('/').filter(Boolean).length
  const prev = useRef(depth)
  const dir = depth > prev.current ? 1 : depth < prev.current ? -1 : 0
  useEffect(() => {
    prev.current = depth
  }, [depth])
  return (
    <m.div key={pathname} initial={{ opacity: 0, x: dir * 28, y: dir ? 0 : 6 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.26, ease }}>
      <Outlet />
    </m.div>
  )
}
