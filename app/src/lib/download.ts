/** No celular abre o compartilhar (WhatsApp, Arquivos, Drive); no computador baixa. */
export async function shareOrDownload(file: File) {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (window.matchMedia('(pointer: coarse)').matches && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: file.name })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
