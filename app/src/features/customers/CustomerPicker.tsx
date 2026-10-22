import { useMemo, useState } from 'react'
import { CaretDown, MagnifyingGlass, Plus, User, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/field'
import { formatPhone } from '@/lib/format'
import { useCustomers } from '@/lib/queries'
import type { Customer } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CustomerDialog } from './CustomerDialog'

/** Escolher cliente com busca, ou cadastrar na hora. */
export function CustomerPicker({ value, onChange, id, disabled }: { value: string | null; onChange: (id: string | null) => void; id?: string; disabled?: boolean }) {
  const customers = useCustomers()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const selected = customers.data?.find((c) => c.id === value)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const d = t.replace(/\D/g, '')
    return (customers.data ?? [])
      .filter((c) => !t || c.name.toLowerCase().includes(t) || c.instagram?.toLowerCase().includes(t.replace('@', '')) || (d.length >= 3 && c.whatsapp?.includes(d)))
      .slice(0, 50)
  }, [customers.data, q])

  return (
    <>
      <div className="flex gap-2">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-ui border border-border-strong bg-surface px-3 text-left text-[15px] hover:border-fg-subtle disabled:opacity-60"
        >
          <User className="size-5 shrink-0 text-fg-subtle" />
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-fg-subtle')}>
            {selected ? selected.name : customers.isPending && value ? 'Carregando...' : 'Escolher cliente'}
          </span>
          <CaretDown className="size-4 text-fg-muted" />
        </button>
        {selected && !disabled && (
          <Button variant="ghost" size="icon" aria-label="Tirar cliente" onClick={() => onChange(null)}>
            <X />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen} title="Cliente">
        <div className="relative mb-3">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input aria-label="Buscar cliente" placeholder="Nome, @ ou telefone" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(q.trim())
            setOpen(false)
          }}
          className="mb-2 flex h-12 w-full items-center gap-3 rounded-ui px-3 text-left text-[15px] font-medium text-accent-text hover:bg-surface-2"
        >
          <Plus className="size-5" /> {q.trim() ? `Cadastrar "${q.trim()}"` : 'Cadastrar cliente novo'}
        </button>
        <ul className="flex flex-col">
          {list.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.id)
                  setOpen(false)
                }}
                className={cn('flex min-h-12 w-full items-center gap-3 rounded-ui px-3 py-2 text-left hover:bg-surface-2', c.id === value && 'bg-surface-2')}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{c.name}</span>
                  <span className="block truncate text-xs text-fg-muted">
                    {[formatPhone(c.whatsapp), c.instagram && `@${c.instagram}`, c.city].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!list.length && customers.data?.length ? <p className="py-6 text-center text-sm text-fg-muted">Ninguém com esse nome.</p> : null}
      </Dialog>

      {creating != null && (
        <CustomerDialog initialName={creating} onClose={() => setCreating(null)} onSaved={(c: Customer) => onChange(c.id)} />
      )}
    </>
  )
}
