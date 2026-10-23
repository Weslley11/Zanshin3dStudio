import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ArrowsOut, GridFour } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Part } from './parse'
import { buildScene, frame, type Bed } from './scene'

/**
 * Visualizador 3D: arraste para girar, pinça ou roda do mouse para aproximar,
 * dois dedos para mover. Só redesenha quando algo muda (poupa bateria).
 */
export default function ModelViewer({ parts, color, bed, className }: { parts: Part[]; color: string; bed: Bed | null; className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ reset: () => void; setColor: (c: string) => void } | null>(null)
  const [showBed, setShowBed] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setError('Este navegador não conseguiu abrir o 3D (WebGL desligado).')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)
    renderer.domElement.className = 'block size-full touch-none'

    const { scene, material, sphere, dispose } = buildScene(parts, color, showBed ? bed : null)
    const camera = new THREE.PerspectiveCamera(35, 1)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(sphere.center)
    controls.screenSpacePanning = true

    const render = () => renderer.render(scene, camera)
    const reset = () => {
      frame(camera, sphere)
      controls.target.copy(sphere.center)
      controls.update()
      render()
    }
    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      render()
    }
    controls.addEventListener('change', render)
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    frame(camera, sphere)
    resize()
    api.current = {
      reset,
      setColor: (c) => {
        material.color.set(c)
        render()
      },
    }

    return () => {
      api.current = null
      ro.disconnect()
      controls.dispose()
      dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
    // a cor muda sem remontar a cena (efeito abaixo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, bed, showBed])

  useEffect(() => {
    api.current?.setColor(color)
  }, [color])

  return (
    <div className={cn('relative overflow-hidden rounded-ui border border-border bg-surface-2/50', className)}>
      <div ref={host} className="size-full" aria-label="Visualização 3D do modelo. Arraste para girar e use pinça para aproximar." role="img" />
      {error && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-fg-muted">{error}</p>}
      <div className="absolute top-2 right-2 flex gap-1">
        {bed && (
          <button
            type="button"
            onClick={() => setShowBed((s) => !s)}
            aria-pressed={showBed}
            className={cn('flex size-9 items-center justify-center rounded-ui border border-border bg-surface/90 backdrop-blur', showBed ? 'text-fg' : 'text-fg-subtle')}
            title="Mostrar a mesa da impressora"
          >
            <GridFour className="size-5" />
            <span className="sr-only">Mostrar a mesa da impressora</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => api.current?.reset()}
          className="flex size-9 items-center justify-center rounded-ui border border-border bg-surface/90 text-fg backdrop-blur"
          title="Centralizar"
        >
          <ArrowsOut className="size-5" />
          <span className="sr-only">Centralizar a vista</span>
        </button>
      </div>
    </div>
  )
}
