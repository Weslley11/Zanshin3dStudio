import { useEffect, useMemo, useRef, useState } from 'react'
import { Cube, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { CatalogPicker } from '@/features/catalog/CatalogPicker'
import { useFilaments, usePrinters, useSettings } from '@/lib/queries'
import type { Filament, Printer, Settings } from '@/lib/types'
import { currentParams, itemFromCatalog, newItem, paramsOutdated, unitPrice, type DraftItem, type ItemParams } from './draft'
import { ItemEditor } from './ItemEditor'

export type DraftContext = {
  settings: Settings
  printers: Printer[]
  filaments: Filament[]
  defaultPrinterId: string | null
  /** parâmetros atuais; com `base`, só atualiza o que vem do carretel e da impressora */
  paramsFor: (printerId: string | null, filamentId: string | null, base?: ItemParams) => ItemParams
}

/**
 * Estado da lista de peças com a calculadora, usado no orçamento e no pedido:
 * itens, alterações não salvas (avisa antes de fechar a aba) e ações.
 */
export function useItemsDraft(init: (ctx: DraftContext) => DraftItem[]) {
  const settings = useSettings().data!
  const printers = usePrinters().data!
  const filaments = useFilaments().data!
  const defaultPrinter = printers.find((p) => p.id === settings.default_printer_id) ?? printers[0]
  const ctx: DraftContext = {
    settings,
    printers,
    filaments,
    defaultPrinterId: defaultPrinter?.id ?? null,
    paramsFor: (printerId, filamentId, base) => {
      const fresh = currentParams(settings, printers.find((p) => p.id === printerId) ?? defaultPrinter, filaments.find((f) => f.id === filamentId))
      // trocar carretel ou impressora só mexe no que vem deles; o resto continua como estava
      return base ? { ...base, costPerG: fresh.costPerG, powerKw: fresh.powerKw, wearPerHour: fresh.wearPerHour } : fresh
    },
  }
  const [items, setItems] = useState<DraftItem[]>(() => init(ctx))
  const dirty = useRef(false)
  const [isDirty, setIsDirty] = useState(false)
  const markDirty = () => {
    if (!dirty.current) {
      dirty.current = true
      setIsDirty(true)
    }
  }
  const markSaved = () => {
    dirty.current = false
    setIsDirty(false)
  }

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const current = useMemo(() => ctx.paramsFor(ctx.defaultPrinterId, null), [settings, printers]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (fn: (l: DraftItem[]) => DraftItem[]) => {
    markDirty()
    setItems(fn)
  }

  return {
    ctx,
    items,
    isDirty,
    markDirty,
    markSaved,
    itemsTotal: items.reduce((s, it) => s + (unitPrice(it) ?? 0) * it.quantity, 0),
    patch: (key: string, patch: Partial<DraftItem>) => update((l) => l.map((it) => (it.key === key ? { ...it, ...patch } : it))),
    remove: (key: string) => update((l) => l.filter((x) => x.key !== key)),
    duplicate: (i: number) => update((l) => [...l.slice(0, i + 1), { ...l[i], key: crypto.randomUUID() }, ...l.slice(i + 1)]),
    add: () => update((l) => [...l, newItem(current, ctx.defaultPrinterId)]),
    addFromCatalog: (c: Parameters<typeof itemFromCatalog>[0]) => {
      const item = itemFromCatalog(c, ctx.paramsFor(ctx.defaultPrinterId, c.filament_id), ctx.defaultPrinterId)
      // troca a primeira peça se ela ainda estiver em branco
      update((l) => (l.length === 1 && !l[0].description && l[0].grams == null ? [item] : [...l, item]))
    },
  }
}

export type ItemsDraft = ReturnType<typeof useItemsDraft>

/** Lista de peças com a calculadora e os botões de adicionar. */
export function ItemsEditorList({ draft, readOnly }: { draft: ItemsDraft; readOnly?: boolean }) {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const { ctx } = draft
  return (
    <>
      {draft.items.map((it, i) => (
        <ItemEditor
          key={it.key}
          item={it}
          index={i}
          filaments={ctx.filaments}
          printers={ctx.printers}
          readOnly={readOnly}
          outdated={paramsOutdated(it, ctx.paramsFor(it.printer_id, it.filament_id))}
          paramsFor={ctx.paramsFor}
          onChange={(patch) => draft.patch(it.key, patch)}
          onRemove={() => draft.remove(it.key)}
          onDuplicate={() => draft.duplicate(i)}
          onRefreshParams={() => draft.patch(it.key, { params: ctx.paramsFor(it.printer_id, it.filament_id) })}
        />
      ))}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={draft.add}>
            <Plus /> Adicionar peça
          </Button>
          <Button variant="ghost" onClick={() => setCatalogOpen(true)}>
            <Cube /> Do catálogo
          </Button>
        </div>
      )}
      <CatalogPicker open={catalogOpen} onOpenChange={setCatalogOpen} onPick={draft.addFromCatalog} />
    </>
  )
}
