import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretRight, MagnifyingGlass, Plus, Users } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'
import { Badge, Card } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { ORIGINS } from '@/lib/constants'
import { brl, formatPhone } from '@/lib/format'
import { useCustomers } from '@/lib/queries'
import { CustomerDialog } from './CustomerDialog'
import { FadeIn } from '@/components/ui/motion'

type Sort = 'nome' | 'gasto' | 'recentes'

export function CustomersPage() {
  const customers = useCustomers()
  const [q, setQ] = useState('')
  const [origin, setOrigin] = useState('')
  const [sort, setSort] = useState<Sort>('nome')
  const [creating, setCreating] = useState(false)

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const digits = term.replace(/\D/g, '')
    let l = (customers.data ?? []).filter(
      (c) =>
        (!origin || c.origin === origin) &&
        (!term ||
          c.name.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term) ||
          c.instagram?.toLowerCase().includes(term.replace('@', '')) ||
          (digits.length >= 3 && c.whatsapp?.includes(digits))),
    )
    if (sort === 'gasto') l = [...l].sort((a, b) => b.total_spent - a.total_spent)
    if (sort === 'recentes') l = [...l].sort((a, b) => (b.last_order_at ?? b.created_at).localeCompare(a.last_order_at ?? a.created_at))
    return l
  }, [customers.data, q, origin, sort])

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Contatos, origem e histórico de cada cliente."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus /> <span className="hidden sm:inline">Novo cliente</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />
      <Page>
        {customers.isPending ? (
          <ListSkeleton rows={6} />
        ) : customers.error ? (
          <ErrorState error={customers.error} onRetry={() => customers.refetch()} />
        ) : !customers.data.length ? (
          <EmptyState
            icon={<Users />}
            title="Nenhum cliente ainda"
            action={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus /> Cadastrar cliente
              </Button>
            }
          >
            Cadastre quem pediu orçamento pelo WhatsApp, Instagram ou site. Você também pode criar o cliente direto na tela de orçamento.
          </EmptyState>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
                <Input
                  aria-label="Buscar cliente"
                  placeholder="Buscar por nome, cidade, @ ou telefone"
                  className="pl-9"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="search"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Select aria-label="Filtrar por origem" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                  <option value="">Todas as origens</option>
                  {Object.entries(ORIGINS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
                <Select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="nome">Nome</option>
                  <option value="gasto">Quem mais gastou</option>
                  <option value="recentes">Mais recentes</option>
                </Select>
              </div>
            </div>

            {!list.length ? (
              <p className="py-10 text-center text-sm text-fg-muted">Nenhum cliente encontrado.</p>
            ) : (
              <Card className="divide-y divide-border overflow-hidden">
                {list.map((c, i) => (
                  <FadeIn key={c.id} index={i}>
                  <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-fg-muted">
                      {c.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{c.name}</span>
                        {c.origin && <Badge className="hidden sm:inline-flex">{ORIGINS[c.origin]}</Badge>}
                      </div>
                      <p className="truncate text-sm text-fg-muted">
                        {[formatPhone(c.whatsapp), c.instagram && `@${c.instagram}`, c.city].filter(Boolean).join(' · ') || 'Sem contato'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="num text-sm font-medium">{brl(c.total_spent)}</div>
                      <div className="num text-xs text-fg-subtle">
                        {c.orders_count} {c.orders_count === 1 ? 'pedido' : 'pedidos'}
                      </div>
                    </div>
                    <CaretRight className="size-4 text-fg-subtle" />
                  </Link>
                  </FadeIn>
                ))}
              </Card>
            )}
          </>
        )}
      </Page>
      {creating && <CustomerDialog onClose={() => setCreating(false)} />}
    </>
  )
}
