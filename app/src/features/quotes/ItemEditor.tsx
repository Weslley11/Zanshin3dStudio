import { useState } from 'react'
import { ArrowCounterClockwise, CaretDown, Copy, DotsThreeVertical, Lightning, Minus, Plus, Trash, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Checkbox, DurationInput, Field, Input, NumberInput, Select } from '@/components/ui/field'
import { Card, Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/misc'
import { FilamentSelect } from '@/features/filaments/FilamentSelect'
import { CATEGORIES } from '@/lib/constants'
import { brl } from '@/lib/format'
import type { Filament, Printer } from '@/lib/types'
import { cn } from '@/lib/utils'
import { compute, unitPrice, type DraftItem, type ItemParams } from './draft'

export function ItemEditor({
  item,
  index,
  filaments,
  printers,
  readOnly,
  outdated,
  onChange,
  onRemove,
  onDuplicate,
  onRefreshParams,
  paramsFor,
}: {
  item: DraftItem
  index: number
  filaments: Filament[]
  printers: Printer[]
  readOnly?: boolean
  outdated: boolean
  onChange: (patch: Partial<DraftItem>) => void
  onRemove: () => void
  onDuplicate: () => void
  onRefreshParams: () => void
  paramsFor: (printerId: string | null, filamentId: string | null, base: ItemParams) => ItemParams
}) {
  const b = compute(item)
  const price = unitPrice(item, b)
  const [showBreakdown, setShowBreakdown] = useState(true)

  const setFilament = (id: string | null) => onChange({ filament_id: id, params: paramsFor(item.printer_id, id, item.params) })
  const setPrinter = (id: string) => onChange({ printer_id: id, params: paramsFor(id, item.filament_id, item.params) })

  return (
    <Card className="animate-enter overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="text-sm font-semibold text-fg-muted">Peça {index + 1}</span>
        {!readOnly && (
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Ações da peça ${index + 1}`}>
                <DotsThreeVertical weight="bold" />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={onDuplicate}>
                <Copy /> Duplicar peça
              </MenuItem>
              <MenuItem danger onSelect={onRemove}>
                <Trash /> Remover peça
              </MenuItem>
            </MenuContent>
          </Menu>
        )}
      </div>

      <div>
        <fieldset disabled={readOnly} className="grid min-w-0 grid-cols-2 gap-4 p-4 sm:grid-cols-6">
          <Field label="Peça" className="col-span-2 sm:col-span-4">
            {(p) => <Input {...p} value={item.description} placeholder="Ex.: Suporte de headset" onChange={(e) => onChange({ description: e.target.value })} />}
          </Field>
          <Field label="Categoria" className="col-span-2" optional>
            {(p) => (
              <Select {...p} value={item.category ?? ''} onChange={(e) => onChange({ category: e.target.value || null })}>
                <option value="">Sem categoria</option>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Carretel" className={cn('col-span-2', printers.length > 1 ? 'sm:col-span-4' : 'sm:col-span-6')}>
            {(p) => <FilamentSelect {...p} filaments={filaments} value={item.filament_id} onChange={setFilament} allowEmpty="Escolha o carretel" />}
          </Field>
          {printers.length > 1 && (
            <Field label="Impressora" className="col-span-2">
              {(p) => (
                <Select {...p} value={item.printer_id ?? ''} onChange={(e) => setPrinter(e.target.value)}>
                  {printers.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          <Field label="Gramas" hint="Por unidade" className="sm:col-span-2">
            {(p) => <NumberInput {...p} suffix="g" digits={1} value={item.grams} onValueChange={(v) => onChange({ grams: v })} />}
          </Field>
          <Field label="Impressão" hint="Tempo por unidade" className="sm:col-span-2">
            {(p) => <DurationInput {...p} value={item.print_minutes} onValueChange={(v) => onChange({ print_minutes: v })} />}
          </Field>
          <Field label="Quantidade" className="col-span-2">
            {(p) => (
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" aria-label="Menos uma" onClick={() => onChange({ quantity: Math.max(1, item.quantity - 1) })}>
                  <Minus />
                </Button>
                <Input
                  {...p}
                  inputMode="numeric"
                  className="num w-16 text-center"
                  value={item.quantity}
                  onChange={(e) => onChange({ quantity: Math.max(1, parseInt(e.target.value.replace(/\D/g, '') || '1', 10)) })}
                />
                <Button type="button" variant="outline" size="icon" aria-label="Mais uma" onClick={() => onChange({ quantity: item.quantity + 1 })}>
                  <Plus />
                </Button>
              </div>
            )}
          </Field>
          <Field label="Pós-processamento" hint="Tempo por unidade" className="sm:col-span-3">
            {(p) => (
              <DurationInput
                {...p}
                value={item.post_hours == null ? null : Math.round(item.post_hours * 60)}
                onValueChange={(v) => onChange({ post_hours: v == null ? null : v / 60 })}
              />
            )}
          </Field>
          <div className="flex items-end sm:col-span-3">
            <Checkbox
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Lightning className="size-4 text-warn" weight="fill" /> Urgente
                  {item.params.urgencyPct != null && <span className="num text-fg-subtle">(+{item.params.urgencyPct}%)</span>}
                </span>
              }
              checked={item.urgent}
              onChange={(e) => onChange({ urgent: e.target.checked })}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-2 sm:col-span-6">
            <span className="text-sm font-medium">
              Extras <span className="font-normal text-fg-subtle">(ímã, parafuso, embalagem; por unidade)</span>
            </span>
            {item.extras.map((ex, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  aria-label={`Extra ${i + 1}: descrição`}
                  className="flex-1"
                  value={ex.label}
                  placeholder="Descrição"
                  onChange={(e) => onChange({ extras: item.extras.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                />
                <div className="w-32">
                  <NumberInput
                    aria-label={`Extra ${i + 1}: valor`}
                    prefix="R$"
                    value={ex.amount}
                    onValueChange={(v) => onChange({ extras: item.extras.map((x, j) => (j === i ? { ...x, amount: v ?? 0 } : x)) })}
                  />
                </div>
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remover extra ${i + 1}`} onClick={() => onChange({ extras: item.extras.filter((_, j) => j !== i) })}>
                    <X />
                  </Button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => onChange({ extras: [...item.extras, { label: '', amount: 0 }] })}>
                <Plus /> Extra
              </Button>
            )}
          </div>
        </fieldset>

        {/* Detalhamento do custo, ao lado do preço */}
        <div className="grid gap-x-8 border-t border-border bg-surface-2/50 p-4 sm:grid-cols-2">
          <div>
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-semibold sm:pointer-events-none"
            onClick={() => setShowBreakdown((s) => !s)}
            aria-expanded={showBreakdown}
          >
            Custo por unidade
            <CaretDown className={cn('size-4 text-fg-muted transition-transform sm:hidden', showBreakdown && 'rotate-180')} />
          </button>
          <dl className={cn('num mt-3 flex-col gap-1.5 text-sm', showBreakdown ? 'flex' : 'hidden sm:flex')}>
            <Row label="Material" value={b.material} />
            <Row label="Energia" value={b.energy} />
            <Row label="Máquina" value={b.machine} />
            <Row label="Mão de obra" value={b.labor} />
            <Row label="Custo" value={b.cost} strong />
            <Row label={`Falha (${item.params.failureRatePct ?? '--'}%)`} value={b.failure} />
            <Row label={`Margem (${item.params.marginPct ?? '--'}%)`} value={b.margin} />
            {item.urgent && <Row label={`Urgência (${item.params.urgencyPct ?? '--'}%)`} value={b.urgency} />}
            <Row label="Extras" value={b.extras} />
          </dl>

          {b.missing.length > 0 && (
            <p className="mt-3 rounded-ui border border-accent/40 bg-accent-soft px-3 py-2 text-xs text-fg">
              Falta: {b.missing.join(', ')}.
            </p>
          )}
          {outdated && !readOnly && (
            <button type="button" onClick={onRefreshParams} className="mt-3 flex items-center gap-1.5 text-xs text-accent-text underline-offset-2 hover:underline">
              <ArrowCounterClockwise className="size-3.5" /> Calculado com parâmetros antigos. Atualizar
            </button>
          )}
          </div>

          <div className="mt-4 border-t border-border pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-fg-muted">Preço calculado</span>
              <span className={cn('num font-medium', item.override_unit_price != null && 'text-fg-subtle line-through')}>
                {b.unitPrice == null ? '--' : brl(b.unitPrice)}
              </span>
            </div>
            <div className="mt-3">
              <Field label="Preço à mão" optional hint={item.override_unit_price != null ? 'O calculado fica guardado.' : undefined}>
                {(p) => (
                  <div className="flex gap-1">
                    <div className="flex-1">
                      <NumberInput
                        {...p}
                        disabled={readOnly}
                        prefix="R$"
                        value={item.override_unit_price}
                        placeholder={b.unitPrice == null ? '' : brl(b.unitPrice).replace('R$ ', '')}
                        onValueChange={(v) => onChange({ override_unit_price: v })}
                      />
                    </div>
                    {item.override_unit_price != null && !readOnly && (
                      <Button type="button" variant="ghost" size="icon" aria-label="Voltar ao preço calculado" onClick={() => onChange({ override_unit_price: null })}>
                        <ArrowCounterClockwise />
                      </Button>
                    )}
                  </div>
                )}
              </Field>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-sm text-fg-muted">
                {item.quantity > 1 ? `${item.quantity} × ${price == null ? '--' : brl(price)}` : 'Total da peça'}
              </span>
              <span className="num text-xl font-semibold">{price == null ? '--' : brl(price * item.quantity)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-2', strong ? 'border-t border-border pt-1.5 font-medium text-fg' : 'text-fg-muted')}>
      <dt>{label}</dt>
      <dd className={strong ? 'text-fg' : 'text-fg'}>{brl(value)}</dd>
    </div>
  )
}
