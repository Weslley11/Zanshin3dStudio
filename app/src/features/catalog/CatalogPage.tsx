import { useMemo, useRef, useState } from 'react'
import { Camera, Cube, DownloadSimple, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Checkbox, DurationInput, Field, Input, NumberInput, Select, Textarea } from '@/components/ui/field'
import { Badge, Card, Segmented } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { FilamentSelect, filamentLabel } from '@/features/filaments/FilamentSelect'
import { currentParams } from '@/features/quotes/draft'
import { CATEGORIES, CATEGORIES_SHORT } from '@/lib/constants'
import { brl, duration, grams } from '@/lib/format'
import { compressImage } from '@/lib/image'
import { calculate } from '@/lib/pricing'
import { keys, must, useAction, useFilaments, usePrinters, useSettings } from '@/lib/queries'
import { errorMessage, photoUrl, supabase, uploadPhoto } from '@/lib/supabase'
import type { CatalogItem, Filament } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useCatalog } from './api'

type Filter = 'todas' | keyof typeof CATEGORIES

export function CatalogPage() {
  const catalog = useCatalog()
  const filaments = useFilaments()
  const [filter, setFilter] = useState<Filter>('todas')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null)

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (catalog.data ?? []).filter((c) => (filter === 'todas' || c.category === filter) && (!t || c.name.toLowerCase().includes(t)))
  }, [catalog.data, filter, q])

  function exportJson() {
    const fil = new Map((filaments.data ?? []).map((f) => [f.id, f]))
    const data = (catalog.data ?? [])
      .filter((c) => c.active)
      .map((c) => {
        const f = c.filament_id ? fil.get(c.filament_id) : undefined
        return {
          // mesmos nomes de campo do js/pecas-data.js do site
          id: c.site_slug || slugify(c.name),
          titulo: c.name,
          categoria: CATEGORIES[c.category],
          descricao: c.description ?? '',
          imagens: c.photo_path ? [{ src: photoUrl(c.photo_path), alt: c.name }] : [],
          preco_base: c.base_price != null ? Number(c.base_price) : null,
          gramas: c.grams != null ? Number(c.grams) : null,
          tempo_minutos: c.print_minutes,
          material: f ? `${f.material} ${f.color_name}` : null,
        }
      })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'zanshin-catalogo.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(`${data.length} peças exportadas`)
  }

  return (
    <>
      <PageHeader
        title="Catálogo"
        description="Peças que você vende sempre, para orçar em segundos."
        actions={
          <>
            <Button variant="ghost" onClick={exportJson} disabled={!catalog.data?.length} aria-label="Exportar JSON">
              <DownloadSimple /> <span className="hidden sm:inline">Exportar JSON</span>
            </Button>
            <Button variant="primary" onClick={() => setEditing('new')}>
              <Plus /> <span className="hidden sm:inline">Nova peça</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </>
        }
      />
      <Page>
        {catalog.isPending ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <ListSkeleton rows={1} height="h-56" />
            <ListSkeleton rows={1} height="h-56" />
          </div>
        ) : catalog.error ? (
          <ErrorState error={catalog.error} onRetry={() => catalog.refetch()} />
        ) : !catalog.data.length ? (
          <EmptyState
            icon={<Cube />}
            title="Catálogo vazio"
            action={
              <Button variant="primary" onClick={() => setEditing('new')}>
                <Plus /> Cadastrar peça
              </Button>
            }
          >
            Cadastre as peças recorrentes com foto, gramas, tempo e filamento. No orçamento, toque em "Do catálogo" e está pronto.
          </EmptyState>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="scrollbar-none -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
                <Segmented<Filter>
                  label="Categoria"
                  value={filter}
                  onChange={setFilter}
                  options={[{ value: 'todas', label: 'Todas' }, ...Object.entries(CATEGORIES_SHORT).map(([k, v]) => ({ value: k as Filter, label: v }))]}
                />
              </div>
              <div className="relative flex-1">
                <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
                <Input aria-label="Buscar peça" placeholder="Buscar peça" className="pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            {!list.length ? (
              <p className="py-10 text-center text-sm text-fg-muted">Nada encontrado.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {list.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setEditing(c)} className="group block h-full w-full text-left">
                      <Card className={cn('flex h-full flex-col overflow-hidden transition-colors group-hover:border-border-strong', !c.active && 'opacity-60')}>
                        {c.photo_path ? (
                          <img src={photoUrl(c.photo_path)!} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center bg-surface-2">
                            <Cube className="size-8 text-fg-subtle" />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col gap-1 p-3">
                          <span className="line-clamp-2 text-sm font-medium">{c.name}</span>
                          <span className="num text-xs text-fg-muted">
                            {grams(c.grams)} · {duration(c.print_minutes)}
                          </span>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                            <span className="num text-sm font-semibold">{c.base_price != null ? brl(Number(c.base_price)) : 'Calcular'}</span>
                            {!c.active && <Badge>Inativa</Badge>}
                          </div>
                        </div>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Page>
      {editing && <CatalogDialog item={editing === 'new' ? null : editing} filaments={filaments.data ?? []} onClose={() => setEditing(null)} />}
    </>
  )
}

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function CatalogDialog({ item, filaments, onClose }: { item: CatalogItem | null; filaments: Filament[]; onClose: () => void }) {
  const settings = useSettings().data
  const printers = usePrinters().data ?? []
  const fileRef = useRef<HTMLInputElement>(null)
  const [v, setV] = useState({
    name: item?.name ?? '',
    category: item?.category ?? 'colecionaveis',
    description: item?.description ?? '',
    grams: item?.grams != null ? Number(item.grams) : null,
    print_minutes: item?.print_minutes ?? null,
    post_hours: item?.post_hours != null ? Number(item.post_hours) : null,
    filament_id: item?.filament_id ?? null,
    base_price: item?.base_price != null ? Number(item.base_price) : null,
    site_slug: item?.site_slug ?? '',
    active: item?.active ?? true,
    photo_path: item?.photo_path ?? null,
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }))

  const printer = printers.find((p) => p.id === settings?.default_printer_id) ?? printers[0]
  const suggestion = calculate(
    { grams: v.grams ?? 0, printMinutes: v.print_minutes ?? 0, postHours: v.post_hours ?? 0, extras: [], urgent: false },
    currentParams(settings, printer, filaments.find((f) => f.id === v.filament_id)),
  )

  const save = useAction(
    async () => {
      const row = { ...v, name: v.name.trim(), description: v.description.trim() || null, site_slug: v.site_slug.trim() || null }
      if (item) return must(await supabase.from('catalog_items').update(row).eq('id', item.id))
      return must(await supabase.from('catalog_items').insert(row))
    },
    { invalidate: [keys.catalog], success: 'Peça salva', onSuccess: onClose },
  )
  const remove = useAction(
    async () => {
      must(await supabase.from('catalog_items').delete().eq('id', item!.id))
      if (item!.photo_path) await supabase.storage.from('photos').remove([item!.photo_path])
    },
    { invalidate: [keys.catalog], success: 'Peça excluída', onSuccess: onClose },
  )

  async function onPhoto(file?: File) {
    if (!file) return
    setUploading(true)
    try {
      const path = await uploadPhoto('catalogo', await compressImage(file))
      set('photo_path', path)
    } catch (e) {
      toast.error(`Não deu para enviar a foto: ${errorMessage(e)}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={item ? 'Editar peça' : 'Nova peça'}
      wide
      footer={
        <>
          {item && (
            <Button variant="danger" className="sm:mr-auto" onClick={() => setDeleting(true)}>
              Excluir
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="catalog-form" loading={save.isPending} disabled={uploading}>
            Salvar peça
          </Button>
        </>
      }
    >
      <form
        id="catalog-form"
        className="grid grid-cols-2 gap-4 sm:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!v.name.trim()) return setError('Dê um nome para a peça.')
          setError(null)
          save.mutate(undefined)
        }}
      >
        <div className="col-span-2 flex gap-4 sm:col-span-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-ui border border-dashed border-border-strong bg-surface-2 text-fg-subtle hover:text-fg"
            aria-label={v.photo_path ? 'Trocar foto' : 'Adicionar foto'}
          >
            {v.photo_path ? <img src={photoUrl(v.photo_path)!} alt="" className="size-full object-cover" /> : <Camera className="size-7" />}
            {uploading && <span className="skeleton absolute inset-0 opacity-80" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Field label="Nome">{(p) => <Input {...p} value={v.name} onChange={(e) => set('name', e.target.value)} />}</Field>
            <Field label="Categoria">
              {(p) => (
                <Select {...p} value={v.category} onChange={(e) => set('category', e.target.value)}>
                  {Object.entries(CATEGORIES).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </div>
        <Field label="Gramas" className="sm:col-span-2">
          {(p) => <NumberInput {...p} suffix="g" digits={1} value={v.grams} onValueChange={(x) => set('grams', x)} />}
        </Field>
        <Field label="Impressão" hint="Tempo" className="sm:col-span-2">
          {(p) => <DurationInput {...p} value={v.print_minutes} onValueChange={(x) => set('print_minutes', x)} />}
        </Field>
        <Field label="Pós-processamento" hint="Tempo" className="col-span-2 sm:col-span-2">
          {(p) => (
            <DurationInput {...p} value={v.post_hours == null ? null : Math.round(v.post_hours * 60)} onValueChange={(x) => set('post_hours', x == null ? null : x / 60)} />
          )}
        </Field>
        <Field label="Filamento padrão" className="col-span-2 sm:col-span-6">
          {(p) => <FilamentSelect {...p} filaments={filaments} value={v.filament_id} onChange={(x) => set('filament_id', x)} allowEmpty="Nenhum" />}
        </Field>
        <Field label="Preço base" hint="Vazio = o orçamento usa o preço calculado." optional className="col-span-2 sm:col-span-3">
          {(p) => <NumberInput {...p} prefix="R$" value={v.base_price} onValueChange={(x) => set('base_price', x)} />}
        </Field>
        <div className="col-span-2 flex flex-col justify-center rounded-ui bg-surface-2 px-4 py-3 sm:col-span-3">
          <span className="text-xs text-fg-subtle">Calculado com os parâmetros atuais</span>
          <span className="num text-lg font-semibold">{suggestion.unitPrice == null ? '--' : brl(suggestion.unitPrice)}</span>
          {suggestion.unitPrice == null ? (
            <span className="text-xs text-fg-muted">Falta: {suggestion.missing.join(', ')}</span>
          ) : (
            <button type="button" className="self-start text-xs text-accent-text hover:underline" onClick={() => set('base_price', suggestion.unitPrice)}>
              Usar como preço base
            </button>
          )}
        </div>
        <Field label="Descrição" optional className="col-span-2 sm:col-span-6">
          {(p) => <Textarea {...p} rows={3} value={v.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>
        <Field label="Identificador no site" hint="O mesmo id da peça em js/pecas-data.js, se ela já estiver na galeria." optional className="col-span-2 sm:col-span-4">
          {(p) => <Input {...p} value={v.site_slug} placeholder={slugify(v.name)} onChange={(e) => set('site_slug', e.target.value)} />}
        </Field>
        <div className="col-span-2 flex items-end">
          <Checkbox label="Ativa" checked={v.active} onChange={(e) => set('active', e.target.checked)} />
        </div>
        {v.filament_id && filaments.find((f) => f.id === v.filament_id)?.archived && (
          <p className="col-span-2 text-xs text-warn sm:col-span-6">
            O carretel padrão ({filamentLabel(filaments.find((f) => f.id === v.filament_id)!)}) está arquivado.
          </p>
        )}
        {error && (
          <p role="alert" className="col-span-2 text-sm text-danger sm:col-span-6">
            {error}
          </p>
        )}
      </form>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Excluir peça do catálogo?"
        description="Orçamentos e pedidos que usaram esta peça não mudam."
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
      />
    </Dialog>
  )
}
