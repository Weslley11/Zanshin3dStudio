import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CubeFocus, FileArrowUp, MagnifyingGlass } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { Badge, Card } from '@/components/ui/misc'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { duration, grams, number } from '@/lib/format'
import { photoUrl } from '@/lib/supabase'
import { formatLabel, storedPlates, useModels, type ModelRow } from './api'
import { useModelUpload } from './useModelUpload'
import { FadeIn } from '@/components/ui/motion'

export function ModelsPage() {
  const models = useModels()
  const upload = useModelUpload()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (models.data ?? []).filter((m) => !t || m.name.toLowerCase().includes(t) || m.file_name.toLowerCase().includes(t))
  }, [models.data, q])

  return (
    <>
      <PageHeader
        title="Modelos 3D"
        description="Veja, meça e orce a partir do STL, 3MF ou do arquivo fatiado do Bambu Studio."
        actions={
          <Button variant="primary" onClick={upload.open} loading={upload.busy}>
            <FileArrowUp /> <span className="hidden sm:inline">Enviar arquivo</span>
            <span className="sm:hidden">Enviar</span>
          </Button>
        }
      />
      <Page>
        {upload.element}
        {models.isPending ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <ListSkeleton key={i} rows={1} height="h-52" />
            ))}
          </div>
        ) : models.error ? (
          <ErrorState error={models.error} onRetry={() => models.refetch()} />
        ) : !models.data.length ? (
          <EmptyState
            icon={<CubeFocus />}
            title="Nenhum modelo ainda"
            action={
              <Button variant="primary" onClick={upload.open}>
                <FileArrowUp /> Enviar o primeiro
              </Button>
            }
          >
            Envie um STL, OBJ ou 3MF para ver em 3D, conferir se cabe na impressora e estimar as gramas. Com o arquivo fatiado do Bambu
            Studio (.gcode.3mf), o tempo e as gramas de cada placa vão direto para o orçamento e a fila.
          </EmptyState>
        ) : (
          <>
            <div className="relative mb-4">
              <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
              <Input aria-label="Buscar modelo" placeholder="Buscar modelo" className="pl-9" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {!list.length ? (
              <p className="py-10 text-center text-sm text-fg-muted">Nada encontrado.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {list.map((m, i) => (
                  <FadeIn as="li" key={m.id} index={i}>
                    <ModelCard m={m} />
                  </FadeIn>
                ))}
              </ul>
            )}
          </>
        )}
      </Page>
    </>
  )
}

function ModelCard({ m }: { m: ModelRow }) {
  const plates = storedPlates(m)
  const totalMin = plates.reduce((s, p) => s + p.minutes, 0)
  const totalG = plates.reduce((s, p) => s + p.grams, 0)
  return (
    <Link to={`/modelos/${m.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-border-strong">
        <div className="relative aspect-[4/3] bg-surface-2">
          {m.thumbnail_path ? (
            <img src={photoUrl(m.thumbnail_path)!} alt="" loading="lazy" className="size-full object-contain p-2" />
          ) : (
            <CubeFocus className="absolute inset-0 m-auto size-8 text-fg-subtle" />
          )}
          <Badge className="absolute top-2 left-2 bg-surface/90 backdrop-blur">{formatLabel(m.format)}</Badge>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <span className="line-clamp-2 text-sm font-medium">{m.name}</span>
          <span className="num text-xs text-fg-muted">
            {plates.length
              ? `${plates.length} ${plates.length === 1 ? 'placa' : 'placas'} · ${duration(totalMin)} · ${grams(totalG)}`
              : m.size_x_mm != null
                ? `${number(Number(m.size_x_mm), 0)} × ${number(Number(m.size_y_mm), 0)} × ${number(Number(m.size_z_mm), 0)} mm`
                : ''}
          </span>
        </div>
      </Card>
    </Link>
  )
}
