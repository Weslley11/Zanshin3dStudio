// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { computeStats, estimateGrams, fitsBed } from './geometry'
import { bambuGcode3mf, binaryStl } from './fixtures'
import { baseName, formatOf, parse3mf, parseModelFile } from './parse'

describe('geometria', () => {
  it('mede um cubo de 20 mm', async () => {
    const m = await parseModelFile(new File([binaryStl(20)], 'cubo.stl'))
    expect(m.format).toBe('stl')
    expect(m.stats!.sizeX).toBeCloseTo(20)
    expect(m.stats!.sizeZ).toBeCloseTo(20)
    expect(m.stats!.volumeCm3).toBeCloseTo(8) // 20³ mm³ = 8 cm³
    expect(m.stats!.areaCm2).toBeCloseTo(24) // 6 × 4 cm²
    expect(m.stats!.triangles).toBe(12)
  })
  it('estima gramas: paredes cheias e miolo pelo preenchimento', () => {
    // cubo de 8 cm³, 24 cm² de área, parede 1 mm → casca 2,4 cm³, miolo 5,6 cm³
    const g = estimateGrams({ volumeCm3: 8, areaCm2: 24, density: 1.24, infillPct: 15, wallMm: 1 })
    expect(g).toBeCloseTo(1.24 * (2.4 + 5.6 * 0.15))
    // peça fina: a casca não passa do volume
    expect(estimateGrams({ volumeCm3: 1, areaCm2: 100, density: 1, infillPct: 15, wallMm: 1 })).toBeCloseTo(1)
  })
  it('confere se cabe na mesa, inclusive girando no plano', () => {
    const bed = { x: 256, y: 256, z: 256 }
    expect(fitsBed({ sizeX: 250, sizeY: 100, sizeZ: 200 }, bed)).toBe(true)
    expect(fitsBed({ sizeX: 300, sizeY: 100, sizeZ: 100 }, bed)).toBe(false)
    expect(fitsBed({ sizeX: 100, sizeY: 100, sizeZ: 260 }, bed)).toBe(false)
    expect(fitsBed({ sizeX: 250, sizeY: 200, sizeZ: 10 }, { x: 200, y: 256, z: 100 })).toBe(true)
  })
  it('malha vazia não quebra', () => {
    expect(computeStats(new Float32Array()).triangles).toBe(0)
  })
})

describe('arquivos', () => {
  it('reconhece o formato pelo nome', () => {
    expect(formatOf('peca.STL')).toBe('stl')
    expect(formatOf('placa.gcode.3mf')).toBe('gcode.3mf')
    expect(formatOf('projeto.3mf')).toBe('3mf')
    expect(formatOf('foto.png')).toBeNull()
    expect(baseName('Dragão v2.gcode.3mf')).toBe('Dragão v2')
  })
  it('lê o .gcode.3mf do Bambu Studio: peças em arquivos separados e placas', () => {
    const m = parse3mf(bambuGcode3mf())
    expect(m.format).toBe('gcode.3mf')
    expect(m.parts.map((p) => p.name)).toEqual(['Suporte', 'Tampa'])
    // a maior peça é o cubo de 20 mm; a tampa é o mesmo cubo pela metade
    expect(m.stats!.sizeX).toBeCloseTo(20)
    expect(m.stats!.volumeCm3).toBeCloseTo(8 + 1)
    // posição vem do item da montagem
    expect(m.parts[0].positions[0]).toBeCloseTo(100)
    expect(m.plates).toHaveLength(2)
    expect(m.plates[0]).toMatchObject({ index: 1, minutes: 91, grams: 25.37, objects: ['Suporte'] })
    expect(m.plates[0].filaments[0]).toMatchObject({ type: 'PLA', color: '#c8100f', grams: 25.37 })
    expect(m.plates[1].filaments).toHaveLength(2)
    expect(m.plates[1].thumbnail?.length).toBe(8)
  })
  it('arquivo que não é zip dá erro claro', () => {
    expect(() => parse3mf(new Uint8Array([1, 2, 3]))).toThrow(/3MF/)
  })
})
