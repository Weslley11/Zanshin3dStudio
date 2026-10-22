import { useMemo, useState } from 'react'
import { Archive, Copy, Disc, DotsThreeVertical, PencilSimple, Plus, Scales, Warning } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { DateInput, Field, Input, NumberInput, Select, Textarea } from '@/components/ui/field'
import { Badge, Card, ColorSwatch, Menu, MenuContent, MenuItem, MenuTrigger, Segmented } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { MATERIALS } from '@/lib/constants'
import { brl, date, grams, todayISO } from '@/lib/format'
import { isLowStock, keys, lowStockLimit, must, useAction, useFilaments, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Filament, Settings } from '@/lib/types'
import { cn } from '@/lib/utils'

type Filter = 'todos' | 'baixo' | (typeof MATERIALS)[number] | 'arquivados'

export function FilamentsPage() {
  const filaments = useFilaments()
  const settings = useSettings()
  const [filter, setFilter] = useState<Filter>('todos')
  const [editing, setEditing] = useState<Partial<Filament> | null>(null)
  const [weighing, setWeighing] = useState<Filament | null>(null)

  const list = useMemo(() => {
    const all = filaments.data ?? []
    if (filter === 'arquivados') return all.filter((f) => f.archived)
    const active = all.filter((f) => !f.archived)
    if (filter === 'todos') return active
    if (filter === 'baixo') return active.filter((f) => isLowStock(f, settings.data))
    return active.filter((f) => f.material === filter)
  }, [filaments.data, filter, settings.data])

  const lowCount = (filaments.data ?? []).filter((f) => isLowStock(f, settings.data)).length
  const materialsInUse = MATERIALS.filter((m) => filaments.data?.some((f) => f.material === m && !f.archived))

  return (
    <>
      <PageHeader
        title="Filamentos"
        description="Carretéis em estoque, custo por grama e alerta de estoque baixo."
        actions={
          <Button variant="primary" onClick={() => setEditing({})}>
            <Plus /> <span className="hidden sm:inline">Novo carretel</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />
      <Page>
        {filaments.isPending ? (
          <ListSkeleton rows={4} height="h-24" />
        ) : filaments.error ? (
          <ErrorState error={filaments.error} onRetry={() => filaments.refetch()} />
        ) : !filaments.data.length ? (
          <EmptyState
            icon={<Disc />}
            title="Nenhum carretel cadastrado"
            action={
              <Button variant="primary" onClick={() => setEditing({})}>
                <Plus /> Cadastrar o primeiro
              </Button>
            }
          >
            Cadastre cada carretel com o preço pago e o peso. O custo por grama sai sozinho e alimenta a calculadora.
          </EmptyState>
        ) : (
          <>
            <div className="scrollbar-none -mx-4 mb-4 overflow-x-auto px-4">
              <Segmented<Filter>
                label="Filtrar carretéis"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'todos', label: 'Todos' },
                  ...(lowCount ? [{ value: 'baixo' as Filter, label: <>Estoque baixo <span className="num text-accent-text">{lowCount}</span></> }] : []),
                  ...materialsInUse.map((m) => ({ value: m as Filter, label: m })),
                  { value: 'arquivados', label: 'Arquivados' },
                ]}
              />
            </div>
            {!list.length ? (
              <p className="py-10 text-center text-sm text-fg-muted">Nada neste filtro.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map((f) => (
                  <FilamentCard
                    key={f.id}
                    f={f}
                    settings={settings.data}
                    onEdit={() => setEditing(f)}
                    onWeigh={() => setWeighing(f)}
                    onDuplicate={() => {
                      const { id: _id, created_at: _c, updated_at: _u, cost_per_g: _g, ...rest } = f
                      setEditing({ ...rest, remaining_g: f.initial_weight_g, purchased_at: todayISO(), archived: false })
                    }}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Page>
      {editing && <FilamentDialog initial={editing} onClose={() => setEditing(null)} />}
      {weighing && <WeighDialog filament={weighing} onClose={() => setWeighing(null)} />}
    </>
  )
}

function FilamentCard({
  f,
  settings,
  onEdit,
  onWeigh,
  onDuplicate,
}: {
  f: Filament
  settings: Settings | undefined
  onEdit: () => void
  onWeigh: () => void
  onDuplicate: () => void
}) {
  const low = isLowStock(f, settings)
  const limit = lowStockLimit(f, settings)
  const pct = Math.max(0, Math.min(100, (f.remaining_g / f.initial_weight_g) * 100))
  const archive = useAction(
    async () => must(await supabase.from('filaments').update({ archived: !f.archived }).eq('id', f.id)),
    { invalidate: [keys.filaments], success: f.archived ? 'Carretel reativado' : 'Carretel arquivado' },
  )

  return (
    <li>
      <Card className={cn('flex h-full flex-col gap-3 p-4', f.archived && 'opacity-70')}>
        <div className="flex items-start gap-3">
          <ColorSwatch hex={f.color_hex} className="mt-0.5 size-9" label={`Cor ${f.color_name}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{f.color_name}</span>
              <Badge className="shrink-0">{f.material}</Badge>
            </div>
            <p className="truncate text-sm text-fg-muted">{f.brand}</p>
          </div>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Ações do carretel ${f.color_name}`}>
                <DotsThreeVertical weight="bold" />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={onWeigh}>
                <Scales /> Atualizar peso
              </MenuItem>
              <MenuItem onSelect={onEdit}>
                <PencilSimple /> Editar
              </MenuItem>
              <MenuItem onSelect={onDuplicate}>
                <Copy /> Comprei outro igual
              </MenuItem>
              <MenuItem onSelect={() => archive.mutate(undefined)}>
                <Archive /> {f.archived ? 'Reativar' : 'Arquivar (acabou)'}
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className={cn('num font-semibold', low ? 'text-accent-text' : 'text-fg')}>{grams(f.remaining_g)}</span>
            <span className="num text-fg-subtle">de {grams(f.initial_weight_g)}</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-3"
            role="meter"
            aria-label="Restante no carretel"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={cn('h-full rounded-full transition-[width] duration-500', low ? 'bg-accent' : 'bg-silver')} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 text-sm">
          <span className="num text-fg-muted">
            {brl((f.cost_per_g ?? 0) * 1000)}/kg · {brl(f.cost_per_g)}/g
          </span>
          {low && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-text">
              <Warning weight="fill" className="size-4" /> abaixo de {grams(limit)}
            </span>
          )}
        </div>
      </Card>
    </li>
  )
}

const PRESET_COLORS = [
  ['Preto', '#1d1f22'],
  ['Branco', '#eceae4'],
  ['Cinza', '#8a9099'],
  ['Prata', '#b9bec5'],
  ['Vermelho', '#c8100f'],
  ['Laranja', '#e46a1f'],
  ['Amarelo', '#e8c22a'],
  ['Verde', '#2f8f4e'],
  ['Azul', '#2456a6'],
  ['Roxo', '#6b3fa0'],
  ['Rosa', '#e58fb0'],
  ['Marrom', '#7a4b2a'],
  ['Pele', '#e8c4a0'],
  ['Dourado', '#c9a227'],
] as const

function FilamentDialog({ initial, onClose }: { initial: Partial<Filament>; onClose: () => void }) {
  const isEdit = Boolean(initial.id)
  const [f, setF] = useState({
    material: initial.material ?? 'PLA',
    brand: initial.brand ?? '',
    color_name: initial.color_name ?? '',
    color_hex: initial.color_hex ?? '#8a9099',
    price_paid: initial.price_paid ?? null,
    initial_weight_g: initial.initial_weight_g ?? null,
    remaining_g: initial.remaining_g ?? null,
    min_stock_g: initial.min_stock_g ?? null,
    purchased_at: initial.purchased_at ?? (isEdit ? null : todayISO()),
    notes: initial.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))
  const costPerG = f.price_paid != null && f.initial_weight_g ? f.price_paid / f.initial_weight_g : null

  const save = useAction(
    async () => {
      const row = {
        ...f,
        brand: f.brand.trim(),
        color_name: f.color_name.trim(),
        price_paid: f.price_paid!,
        initial_weight_g: f.initial_weight_g!,
        remaining_g: f.remaining_g ?? f.initial_weight_g!,
        notes: f.notes.trim() || null,
      }
      if (isEdit) return must(await supabase.from('filaments').update(row).eq('id', initial.id!))
      return must(await supabase.from('filaments').insert(row))
    },
    { invalidate: [keys.filaments], success: 'Carretel salvo', onSuccess: onClose },
  )

  function submit() {
    if (!f.brand.trim() || !f.color_name.trim()) return setError('Preencha marca e cor.')
    if (f.price_paid == null || f.price_paid < 0) return setError('Informe o preço pago.')
    if (!f.initial_weight_g || f.initial_weight_g <= 0) return setError('Informe o peso inicial do filamento (sem o carretel).')
    if (f.remaining_g != null && f.remaining_g > f.initial_weight_g) return setError('O restante não pode passar do peso inicial.')
    setError(null)
    save.mutate(undefined)
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? 'Editar carretel' : 'Novo carretel'}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="filament-form" loading={save.isPending}>
            Salvar carretel
          </Button>
        </>
      }
    >
      <form
        id="filament-form"
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="Material">
          {(p) => (
            <Select {...p} value={f.material} onChange={(e) => set('material', e.target.value)}>
              {MATERIALS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Marca">{(p) => <Input {...p} required value={f.brand} onChange={(e) => set('brand', e.target.value)} />}</Field>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Field label="Cor">
            {(p) => (
              <div className="flex gap-2">
                <Input {...p} required value={f.color_name} onChange={(e) => set('color_name', e.target.value)} className="flex-1" />
                <label className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-ui border border-border-strong">
                  <span className="sr-only">Escolher a cor exata</span>
                  <ColorSwatch hex={f.color_hex} className="size-7" />
                  <input type="color" value={f.color_hex} onChange={(e) => set('color_hex', e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>
            )}
          </Field>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cores rápidas">
            {PRESET_COLORS.map(([name, hex]) => (
              <button
                key={hex}
                type="button"
                title={name}
                aria-label={name}
                onClick={() => setF((s) => ({ ...s, color_hex: hex, color_name: s.color_name || name }))}
                className={cn('rounded-full p-0.5 ring-offset-2 ring-offset-surface', f.color_hex === hex && 'ring-2 ring-ring')}
              >
                <ColorSwatch hex={hex} className="size-7" />
              </button>
            ))}
          </div>
        </div>

        <Field label="Preço pago">{(p) => <NumberInput {...p} prefix="R$" value={f.price_paid} onValueChange={(v) => set('price_paid', v)} />}</Field>
        <Field label="Peso inicial" hint="Só o filamento, sem o carretel. Ex.: 1000 g.">
          {(p) => <NumberInput {...p} suffix="g" digits={1} value={f.initial_weight_g} onValueChange={(v) => set('initial_weight_g', v)} />}
        </Field>
        <Field label="Restante" hint={isEdit ? 'Desconta sozinho quando uma placa é concluída.' : 'Vazio = carretel novo, cheio.'} optional={!isEdit}>
          {(p) => <NumberInput {...p} suffix="g" digits={1} value={f.remaining_g} onValueChange={(v) => set('remaining_g', v)} />}
        </Field>
        <Field label="Estoque mínimo" hint="Vazio = usa o padrão das configurações." optional>
          {(p) => <NumberInput {...p} suffix="g" digits={0} value={f.min_stock_g} onValueChange={(v) => set('min_stock_g', v)} />}
        </Field>
        <Field label="Data da compra" optional>
          {(p) => <DateInput {...p} value={f.purchased_at} onValueChange={(v) => set('purchased_at', v)} />}
        </Field>
        <div className="flex flex-col justify-end rounded-ui bg-surface-2 px-4 py-3">
          <span className="text-xs text-fg-subtle">Custo por grama</span>
          <span className="num text-lg font-semibold">{costPerG == null ? '--' : `${brl(costPerG)} /g`}</span>
          {costPerG != null && <span className="num text-xs text-fg-muted">{brl(costPerG * 1000)} por kg</span>}
        </div>
        <Field label="Observações" optional className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />}
        </Field>
        {initial.purchased_at && isEdit && <p className="text-xs text-fg-subtle sm:col-span-2">Comprado em {date(initial.purchased_at)}</p>}
        {error && (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  )
}

/** Pesar o carretel na balança e descontar o peso do carretel vazio. */
function WeighDialog({ filament, onClose }: { filament: Filament; onClose: () => void }) {
  const [remaining, setRemaining] = useState<number | null>(filament.remaining_g)
  const save = useAction(
    async () => must(await supabase.from('filaments').update({ remaining_g: Math.max(0, remaining ?? 0) }).eq('id', filament.id)),
    { invalidate: [keys.filaments], success: 'Peso atualizado', onSuccess: onClose },
  )
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Atualizar peso"
      description={`${filament.material} ${filament.color_name} · ${filament.brand}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => save.mutate(undefined)} loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <Field label="Filamento restante" hint="Peso na balança menos o peso do carretel vazio.">
        {(p) => <NumberInput {...p} suffix="g" digits={1} value={remaining} onValueChange={setRemaining} autoFocus />}
      </Field>
    </Dialog>
  )
}

