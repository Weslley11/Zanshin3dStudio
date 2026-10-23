import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildPiece, RING } from './pieces'
import { sliceLayers } from './slice'
import { demoState, DEMO, jobProgress, layerOf, LAYERS, pieceFor, PIECES } from './timeline'

describe('fatiador da cena', () => {
  it('corta um cubo em quadrados com pontos em sequência', () => {
    const cube = new THREE.BoxGeometry(1, 1, 1).toNonIndexed()
    cube.translate(0, 0.5, 0)
    const layers = sliceLayers(cube.attributes.position.array, 1, 10, 40)
    expect(layers).toHaveLength(10)
    for (const pts of layers) {
      expect(pts).toHaveLength(80)
      for (let i = 0; i < 40; i++) {
        // todo ponto está na borda do quadrado de lado 1
        expect(Math.max(Math.abs(pts[i * 2]), Math.abs(pts[i * 2 + 1]))).toBeCloseTo(0.5, 5)
      }
      // perímetro 4 em 40 pontos: vizinhos a 0,1 (contorno encadeado, sem saltos)
      for (let i = 1; i < 40; i++) {
        expect(Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1])).toBeLessThan(0.1001)
      }
    }
  })

  it('camada sem nada fica vazia', () => {
    const cube = new THREE.BoxGeometry(1, 1, 1).toNonIndexed()
    cube.translate(0, 0.5, 0)
    const layers = sliceLayers(cube.attributes.position.array, 2, 4, 10)
    expect(layers[0].length).toBe(20)
    expect(layers[3].length).toBe(0)
  })
})

describe('peças', () => {
  it.each(PIECES.map((p) => p.id))('%s fica na mesa, cabe na cena e tem contorno em toda altura', (id) => {
    const piece = buildPiece(id)
    piece.geometry.computeBoundingBox()
    const box = piece.geometry.boundingBox!
    expect(box.min.y).toBeCloseTo(0, 5)
    expect(piece.height).toBeLessThanOrEqual(3.1 + 1e-6)
    expect(Math.max(box.max.x - box.min.x, box.max.z - box.min.z)).toBeLessThanOrEqual(3.8 + 1e-6)
    const filled = piece.layers.filter((l) => l.length === RING * 2).length
    expect(filled / piece.layers.length).toBeGreaterThan(0.97)
  })
})

describe('tempo da cena', () => {
  it('a demonstração imprime, segura pronta, apaga e troca de peça', () => {
    expect(demoState(0)).toMatchObject({ p: 0, opacity: 1, piece: PIECES[0].id })
    expect(demoState(DEMO.print / 2).p).toBeCloseTo(0.5, 5)
    expect(demoState(DEMO.print + 1)).toMatchObject({ p: 1, opacity: 1 })
    expect(demoState(DEMO.print + DEMO.hold + DEMO.fade / 2).opacity).toBeCloseTo(0.5, 5)
    const cycle = DEMO.print + DEMO.hold + DEMO.fade
    expect(demoState(cycle + 0.01).piece).toBe(PIECES[1].id)
    expect(demoState(cycle * PIECES.length + 0.01).piece).toBe(PIECES[0].id)
  })

  it('camadas e progresso de uma placa', () => {
    expect(layerOf(0.5)).toBe(LAYERS / 2)
    expect(layerOf(2)).toBe(LAYERS)
    const start = Date.UTC(2026, 9, 23, 12)
    expect(jobProgress(start, 120, start + 60 * 60_000)).toBeCloseTo(0.5, 5)
    // atrasada não passa de quase pronta; sem tempo estimado fica no zero
    expect(jobProgress(start, 120, start + 300 * 60_000)).toBe(0.995)
    expect(jobProgress(start, 0, start + 1)).toBe(0)
  })

  it('a mesma placa sempre mostra a mesma peça', () => {
    expect(pieceFor('abc')).toBe(pieceFor('abc'))
    const seen = new Set(Array.from({ length: 30 }, (_, i) => pieceFor(`placa-${i}`)))
    expect(seen.size).toBe(PIECES.length)
  })
})
