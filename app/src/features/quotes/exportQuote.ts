import { toPng } from 'html-to-image'

async function renderPng(node: HTMLElement) {
  // duas passadas: a primeira carrega fontes e imagens no Safari
  await toPng(node, { pixelRatio: 2, cacheBust: true }).catch(() => null)
  return toPng(node, { pixelRatio: 2, cacheBust: true })
}

function dataUrlToFile(dataUrl: string, name: string) {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)![1]
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], name, { type: mime })
}

function download(href: string, name: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Imagem: no celular abre o compartilhar (dá para mandar direto no WhatsApp); no desktop baixa. */
export async function shareQuoteImage(node: HTMLElement, name: string) {
  return shareImageFile(dataUrlToFile(await renderPng(node), `${name}.png`))
}

export async function shareImageFile(file: File) {
  const name = file.name.replace(/\.png$/, '')
  const url = URL.createObjectURL(file)
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (window.matchMedia('(pointer: coarse)').matches && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  download(url, `${name}.png`)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}

export async function downloadQuotePdf(node: HTMLElement, name: string) {
  const [{ jsPDF }, url] = await Promise.all([import('jspdf'), renderPng(node)])
  const img = new Image()
  img.src = url
  await img.decode()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  let w = pageW
  let h = (img.height / img.width) * w
  if (h > pageH) {
    h = pageH
    w = (img.width / img.height) * h
  }
  pdf.addImage(url, 'PNG', (pageW - w) / 2, 0, w, h)
  pdf.save(`${name}.pdf`)
}
