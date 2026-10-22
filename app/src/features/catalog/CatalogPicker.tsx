import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cube, MagnifyingGlass } from '@phosphor-icons/react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/field'
import { ListSkeleton } from '@/components/ui/states'
import { CATEGORIES } from '@/lib/constants'
import { brl, duration, grams } from '@/lib/format'
import { photoUrl } from '@/lib/supabase'
import type { CatalogItem } from '@/lib/types'
import { useCatalog } from './api'

export function CatalogPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (c: CatalogItem) => void }) {
  const catalog = useCatalog()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (catalog.data ?? []).filter((c) => c.active && (!t || c.name.toLowerCase().includes(t)))
  }, [catalog.data, q])

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Peça do catálogo" description="Preenche gramas, tempo e filamento padrão.">
      {catalog.isPending ? (
        <ListSkeleton rows={4} />
      ) : !catalog.data?.length ? (
        <div className="py-8 text-center text-sm text-fg-muted">
          <Cube className="mx-auto mb-2 size-8 text-fg-subtle" />
          O catálogo está vazio. Cadastre as peças que você vende sempre em{' '}
          <Link to="/catalogo" className="text-accent-text underline underline-offset-2">
            Catálogo
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input aria-label="Buscar peça" placeholder="Buscar peça" className="pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <ul className="flex flex-col gap-1">
            {list.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(c)
                    onOpenChange(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-ui p-2 text-left hover:bg-surface-2"
                >
                  {c.photo_path ? (
                    <img src={photoUrl(c.photo_path)!} alt="" className="size-12 rounded-ui object-cover" loading="lazy" />
                  ) : (
                    <span className="flex size-12 items-center justify-center rounded-ui bg-surface-3">
                      <Cube className="size-5 text-fg-subtle" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{c.name}</span>
                    <span className="num block truncate text-xs text-fg-muted">
                      {CATEGORIES[c.category]} · {grams(c.grams)} · {duration(c.print_minutes)}
                    </span>
                  </span>
                  {c.base_price != null && <span className="num text-sm font-medium">{brl(c.base_price)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  )
}
