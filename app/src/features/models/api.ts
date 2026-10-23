import { useQuery } from '@tanstack/react-query'
import { must } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Filament, Row } from '@/lib/types'
import { parseModelFile, type PlateFilament } from './parse'

export type ModelRow = Row<'models'>
export type StoredPlate = { index: number; minutes: number; grams: number; filaments: PlateFilament[]; objects: string[]; thumbnail_path: string | null }

export const MODEL_BUCKET = 'models'
export const MAX_MODEL_BYTES = 50 * 1024 * 1024

export const modelKeys = {
  all: ['models'] as const,
  one: (id: string) => ['models', id] as const,
  mesh: (path: string) => ['models', 'mesh', path] as const,
}

export function useModels() {
  return useQuery({
    queryKey: modelKeys.all,
    queryFn: async () => must(await supabase.from('models').select('*').order('created_at', { ascending: false })) as ModelRow[],
  })
}

export function useModel(id: string | undefined) {
  return useQuery({
    queryKey: modelKeys.one(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => must(await supabase.from('models').select('*').eq('id', id!).single()) as ModelRow,
  })
}

/** Baixa o arquivo do bucket privado (link assinado) e lê a malha de novo para o 3D. */
export function useModelMesh(model: ModelRow | undefined) {
  return useQuery({
    queryKey: modelKeys.mesh(model?.file_path ?? ''),
    enabled: Boolean(model),
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(MODEL_BUCKET).download(model!.file_path)
      if (error) throw error
      return parseModelFile(new File([data], model!.file_name))
    },
  })
}

export async function signedDownloadUrl(path: string, fileName: string) {
  const { data, error } = await supabase.storage.from(MODEL_BUCKET).createSignedUrl(path, 300, { download: fileName })
  if (error) throw error
  return data.signedUrl
}

export function storedPlates(model: Pick<ModelRow, 'plates'>): StoredPlate[] {
  return Array.isArray(model.plates) ? (model.plates as unknown as StoredPlate[]) : []
}

function hexDistance(a: string, b: string) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) || 0)
  const [x, y] = [p(a), p(b)]
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

/** Carretel do estoque mais parecido com o filamento do fatiador (mesmo material, cor mais próxima). */
export function matchFilament(stock: Filament[], f: PlateFilament | undefined) {
  if (!f) return null
  const type = f.type.toUpperCase()
  const same = stock.filter((s) => !s.archived && (type.startsWith(s.material) || s.material === type))
  if (!same.length) return null
  return same.reduce((best, s) => (hexDistance(s.color_hex, f.color) < hexDistance(best.color_hex, f.color) ? s : best))
}

/** Filamento que mais pesa na placa. */
export function mainFilament(filaments: PlateFilament[]) {
  return filaments.reduce<PlateFilament | undefined>((a, b) => (!a || b.grams > a.grams ? b : a), undefined)
}

export function formatLabel(f: string) {
  return f === 'gcode.3mf' ? 'Fatiado' : f.toUpperCase()
}
