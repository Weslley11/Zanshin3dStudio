import { must } from '@/lib/queries'
import { PHOTO_BUCKET, supabase } from '@/lib/supabase'
import { MAX_MODEL_BYTES, MODEL_BUCKET, type StoredPlate } from './api'
import { baseName, parseModelFile } from './parse'

export type UploadStep = 'lendo' | 'miniatura' | 'enviando' | 'pronto'

/** Lê o arquivo no aparelho, gera a miniatura e guarda tudo no Supabase. */
export async function uploadModel(file: File, onStep: (s: UploadStep) => void) {
  if (file.size > MAX_MODEL_BYTES) throw new Error('Arquivo maior que 50 MB, o limite do Supabase gratuito. Exporte com menos detalhes ou só a placa que vai imprimir.')
  onStep('lendo')
  const parsed = await parseModelFile(file)
  if (!parsed.parts.length && !parsed.plates.length) throw new Error('O arquivo não tem nenhuma peça que dê para mostrar.')

  onStep('miniatura')
  const id = crypto.randomUUID()
  let thumbnail: Blob | null = null
  if (parsed.parts.length) {
    const { renderImage } = await import('./scene')
    thumbnail = await renderImage(parsed.parts, '#b9bec5').catch(() => null)
  }
  if (!thumbnail && parsed.plates[0]?.thumbnail) thumbnail = new Blob([parsed.plates[0].thumbnail as BlobPart], { type: 'image/png' })

  onStep('enviando')
  const safe = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_')
  const filePath = `${id}/${safe}`
  const up = await supabase.storage.from(MODEL_BUCKET).upload(filePath, file, { contentType: 'application/octet-stream' })
  if (up.error) throw up.error

  const putImage = async (path: string, blob: Blob) => {
    const r = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/png', cacheControl: '31536000' })
    return r.error ? null : path
  }
  const thumbnailPath = thumbnail ? await putImage(`modelos/${id}/${crypto.randomUUID()}.png`, thumbnail) : null
  const plates: StoredPlate[] = []
  for (const p of parsed.plates) {
    const path = p.thumbnail ? await putImage(`modelos/${id}/placa-${p.index}-${crypto.randomUUID()}.png`, new Blob([p.thumbnail as BlobPart], { type: 'image/png' })) : null
    plates.push({ index: p.index, minutes: p.minutes, grams: p.grams, filaments: p.filaments, objects: p.objects, thumbnail_path: path })
  }

  const s = parsed.stats
  const row = must(
    await supabase
      .from('models')
      .insert({
        id,
        name: baseName(file.name),
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        format: parsed.format,
        thumbnail_path: thumbnailPath,
        size_x_mm: s ? round(s.sizeX, 2) : null,
        size_y_mm: s ? round(s.sizeY, 2) : null,
        size_z_mm: s ? round(s.sizeZ, 2) : null,
        volume_cm3: s ? round(s.volumeCm3, 3) : null,
        area_cm2: s ? round(s.areaCm2, 3) : null,
        triangles: s?.triangles ?? null,
        parts: parsed.parts.length,
        plates: plates as unknown as never,
      })
      .select('id')
      .single(),
  ) as { id: string }
  onStep('pronto')
  return row.id
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d
