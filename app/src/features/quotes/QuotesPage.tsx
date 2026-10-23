import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, CaretRight, Eye, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { Badge, Card, Segmented } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { QUOTE_STATUS_LABEL } from '@/lib/constants'
import { brl, date, daysUntil, docNumber } from '@/lib/format'
import { useQuotes } from './api'
import { FadeIn } from '@/components/ui/motion'

type Filter = 'abertos' | 'aprovado' | 'recusado' | 'todos'

export function QuotesPage() {
  const quotes = useQuotes()
  const [filter, setFilter] = useState<Filter>('abertos')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (quotes.data ?? []).filter((x) => {
      if (filter === 'abertos' && !['rascunho', 'enviado'].includes(x.status)) return false
      if ((filter === 'aprovado' || filter === 'recusado') && x.status !== filter) return false
      if (!t) return true
      return (
        docNumber(x.number).toLowerCase().includes(t) ||
        String(x.number).includes(t) ||
        x.customer?.name.toLowerCase().includes(t) ||
        x.items.some((i) => i.description.toLowerCase().includes(t))
      )
    })
  }, [quotes.data, filter, q])

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Calcule o preço, mande pelo WhatsApp e transforme em pedido."
        actions={
          <Button asChild variant="primary">
            <Link to="/orcamentos/novo">
              <Plus /> <span className="hidden sm:inline">Novo orçamento</span>
              <span className="sm:hidden">Novo</span>
            </Link>
          </Button>
        }
      />
      <Page>
        {quotes.isPending ? (
          <ListSkeleton rows={6} />
        ) : quotes.error ? (
          <ErrorState error={quotes.error} onRetry={() => quotes.refetch()} />
        ) : !quotes.data.length ? (
          <EmptyState
            icon={<Calculator />}
            title="Nenhum orçamento ainda"
            action={
              <Button asChild variant="primary">
                <Link to="/orcamentos/novo">
                  <Plus /> Fazer o primeiro orçamento
                </Link>
              </Button>
            }
          >
            Informe gramas e tempo de cada peça, escolha o carretel e o app calcula o preço com os parâmetros das Configurações.
          </EmptyState>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <Segmented<Filter>
                  label="Filtrar orçamentos"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'abertos', label: 'Em aberto' },
                    { value: 'aprovado', label: 'Aprovados' },
                    { value: 'recusado', label: 'Recusados' },
                    { value: 'todos', label: 'Todos' },
                  ]}
                />
              </div>
              <div className="relative flex-1">
                <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
                <Input aria-label="Buscar orçamento" placeholder="Número, cliente ou peça" className="pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            {!list.length ? (
              <p className="py-10 text-center text-sm text-fg-muted">Nenhum orçamento neste filtro.</p>
            ) : (
              <Card className="divide-y divide-border overflow-hidden">
                {list.map((x, i) => {
                  const expired = x.valid_until && ['rascunho', 'enviado'].includes(x.status) && daysUntil(x.valid_until) < 0
                  return (
                    <FadeIn key={x.id} index={i}>
                    <Link to={`/orcamentos/${x.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="num font-medium">{docNumber(x.number)}</span>
                          <span className="truncate text-fg-muted">{x.customer?.name ?? 'Sem cliente'}</span>
                        </div>
                        <p className="truncate text-sm text-fg-subtle">{x.items.map((i) => i.description).join(', ') || 'Sem peças'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="num text-sm font-semibold">{brl(Number(x.total))}</span>
                        <span className="flex items-center gap-1.5">
                          {x.client_viewed_at && x.status !== 'aprovado' && (
                            <Eye className="size-4 text-ok" weight="fill" aria-label="O cliente abriu o link" />
                          )}
                          {expired ? (
                            <Badge tone="warn">Vencido</Badge>
                          ) : (
                            <Badge tone={x.status === 'aprovado' ? 'ok' : 'neutral'}>
                              {x.status === 'aprovado' && x.approved_via === 'cliente' ? 'Aprovado pelo cliente' : QUOTE_STATUS_LABEL[x.status]}
                            </Badge>
                          )}
                          <span className="num hidden text-xs text-fg-subtle sm:inline">{date(x.created_at)}</span>
                        </span>
                      </div>
                      <CaretRight className="size-4 text-fg-subtle" />
                    </Link>
                    </FadeIn>
                  )
                })}
              </Card>
            )}
          </>
        )}
      </Page>
    </>
  )
}
