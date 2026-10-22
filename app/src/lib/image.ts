/** Reduz a foto do celular (vários MB) para no máximo 1600 px antes de enviar. */
export async function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality))
  // WebP quando o navegador gera; senão JPEG
  let blob = await toBlob('image/webp')
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg')
  if (!blob || blob.size >= file.size) return file
  return new File([blob], file.name.replace(/\.\w+$/, blob.type === 'image/webp' ? '.webp' : '.jpg'), { type: blob.type })
}
