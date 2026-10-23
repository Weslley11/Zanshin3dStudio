import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { createPrintScene, type Framing } from './scene'
import { demoState, easeOutCubic, layerOf, PIECES, type PieceId } from './timeline'

export type PrintSceneProps = {
  /** 0 a 1 de uma placa de verdade; sem valor, roda a demonstração em loop */
  progress?: number
  /** cor do filamento; sem cor, o vermelho da marca */
  color?: string | null
  /** peça fixa (uma placa de verdade); sem valor, a demonstração alterna as peças */
  piece?: PieceId
  framing?: Framing
  /** demonstração: avisa a cada camada nova e qual peça está na mesa (para o contador) */
  onLayer?: (layer: number, piece: PieceId) => void
  className?: string
}

const BRAND = '#c8100f'
// ao abrir, a peça sobe de zero até o progresso real
const INTRO = 1.8
// "reduzir movimento": a demonstração fica parada nesta altura
const STILL_DEMO = 0.62

/**
 * Cena 3D da impressão. Só desenha enquanto aparece na tela e a aba está
 * aberta; com "reduzir movimento" desenha um quadro parado e só redesenha
 * quando algo muda. Sem WebGL, some e fica o fundo de linhas de camada.
 */
export default function PrintScene({ progress, color, piece, framing = 'card', onLayer, className }: PrintSceneProps) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const still = useReducedMotion() ?? false
  const live = useRef({ progress, piece, onLayer })
  live.current = { progress, piece, onLayer }
  const api = useRef<{ setColor: (c: string) => void; redraw: () => void } | null>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let s: ReturnType<typeof createPrintScene>
    try {
      s = createPrintScene(framing)
    } catch {
      setFailed(true)
      return
    }
    const canvas = s.canvas
    canvas.className = 'block size-full'
    el.appendChild(canvas)
    s.setColor(color || BRAND)
    s.setPiece(piece ?? PIECES[0].id)

    const lost = (e: Event) => {
      e.preventDefault()
      setFailed(true)
    }
    canvas.addEventListener('webglcontextlost', lost)

    // a névoa se perde na cor do fundo de quem está atrás da cena
    const readBackground = () => {
      for (let node: HTMLElement | null = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor
        if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) return s.setBackground(bg)
      }
    }
    readBackground()

    let t0 = performance.now()
    let shown = 0
    let lastLayer = -1
    let lastPiece: PieceId | null = null
    let px = 0
    let py = 0
    let tx = 0
    let ty = 0
    let lastFrame = 0
    let raf = 0
    let visible = true
    const minGap = framing === 'card' ? 1000 / 30 - 2 : 0

    const draw = (now: number) => {
      // o quadro do navegador pode vir datado um pouco antes do início
      const t = Math.max(0, now - t0) / 1000
      const { progress: target, piece: fixed } = live.current
      let p: number
      if (target === undefined) {
        const d = still ? { p: STILL_DEMO, opacity: 1, piece: PIECES[0].id } : demoState(t)
        const id = fixed ?? d.piece
        s.setPiece(id)
        p = d.p
        canvas.style.opacity = String(d.opacity)
        const layer = layerOf(p)
        if (layer !== lastLayer || id !== lastPiece) {
          lastLayer = layer
          lastPiece = id
          live.current.onLayer?.(layer, id)
        }
      } else {
        s.setPiece(fixed ?? PIECES[0].id)
        if (still) p = target
        else p = shown = t < INTRO ? target * easeOutCubic(t / INTRO) : shown + (target - shown) * 0.04
      }
      px += (tx - px) * 0.05
      py += (ty - py) * 0.05
      s.render({ t, p, still, px, py })
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible || document.hidden || now - lastFrame < minGap) return
      lastFrame = now
      draw(now)
    }
    const redraw = () => {
      if (still) draw(performance.now())
    }

    const ro = new ResizeObserver(() => {
      s.resize(el.clientWidth, el.clientHeight)
      redraw()
    })
    ro.observe(el)
    s.resize(el.clientWidth, el.clientHeight)

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)

    const theme = new MutationObserver(() => {
      readBackground()
      redraw()
    })
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    // no herói, a câmera acompanha de leve o mouse (só onde existe mouse)
    const pointer = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5
      ty = e.clientY / window.innerHeight - 0.5
    }
    const parallax = framing === 'hero' && !still && window.matchMedia('(hover: hover)').matches
    if (parallax) window.addEventListener('pointermove', pointer, { passive: true })

    if (still) {
      draw(performance.now())
    } else {
      canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
      t0 = performance.now()
      raf = requestAnimationFrame(tick)
    }

    api.current = {
      setColor: (c) => {
        s.setColor(c)
        redraw()
      },
      redraw,
    }

    return () => {
      api.current = null
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      theme.disconnect()
      window.removeEventListener('pointermove', pointer)
      canvas.removeEventListener('webglcontextlost', lost)
      s.dispose()
      canvas.remove()
    }
    // cor e progresso mudam sem remontar a cena (efeitos abaixo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framing, still])

  useEffect(() => {
    api.current?.setColor(color || BRAND)
  }, [color])

  useEffect(() => {
    api.current?.redraw()
  }, [progress, piece])

  if (failed) return null
  return <div ref={host} className={cn('size-full', className)} />
}
