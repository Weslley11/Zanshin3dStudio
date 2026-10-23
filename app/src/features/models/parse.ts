import { unzipSync, strFromU8 } from 'fflate'
import { computeStats, type Stats } from './geometry'

export type ModelFormat = 'stl' | '3mf' | 'obj' | 'gcode.3mf'
export type Part = { name: string; positions: Float32Array }
export type PlateFilament = { type: string; color: string; grams: number; meters: number }
export type Plate = {
  index: number
  minutes: number
  grams: number
  filaments: PlateFilament[]
  objects: string[]
  thumbnail?: Uint8Array
}
export type ParsedModel = {
  format: ModelFormat
  parts: Part[]
  plates: Plate[]
  /** medidas da maior peça; volume, área e triângulos somam todas */
  stats: Stats | null
}

export function formatOf(fileName: string): ModelFormat | null {
  const n = fileName.toLowerCase()
  if (n.endsWith('.gcode.3mf')) return 'gcode.3mf'
  if (n.endsWith('.3mf')) return '3mf'
  if (n.endsWith('.stl')) return 'stl'
  if (n.endsWith('.obj')) return 'obj'
  return null
}

export async function parseModelFile(file: File): Promise<ParsedModel> {
  const format = formatOf(file.name)
  if (!format) throw new Error('Formato não aceito. Use STL, 3MF, OBJ ou o .gcode.3mf do Bambu Studio.')
  const buffer = await file.arrayBuffer()
  if (format === 'stl') return withStats('stl', [{ name: baseName(file.name), positions: await parseStl(buffer) }], [])
  if (format === 'obj') return withStats('obj', [{ name: baseName(file.name), positions: await parseObj(new TextDecoder().decode(buffer)) }], [])
  return parse3mf(new Uint8Array(buffer), format)
}

export function baseName(fileName: string) {
  return fileName.replace(/\.gcode\.3mf$/i, '').replace(/\.(stl|3mf|obj)$/i, '')
}

function withStats(format: ModelFormat, parts: Part[], plates: Plate[]): ParsedModel {
  const nonEmpty = parts.filter((p) => p.positions.length)
  if (!nonEmpty.length) return { format, parts: [], plates, stats: null }
  const each = nonEmpty.map((p) => computeStats(p.positions))
  const largest = each.reduce((a, b) => (b.sizeX * b.sizeY * b.sizeZ > a.sizeX * a.sizeY * a.sizeZ ? b : a))
  return {
    format,
    parts: nonEmpty,
    plates,
    stats: {
      sizeX: largest.sizeX,
      sizeY: largest.sizeY,
      sizeZ: largest.sizeZ,
      volumeCm3: each.reduce((s, x) => s + x.volumeCm3, 0),
      areaCm2: each.reduce((s, x) => s + x.areaCm2, 0),
      triangles: each.reduce((s, x) => s + x.triangles, 0),
    },
  }
}

async function parseStl(buffer: ArrayBuffer) {
  const { STLLoader } = await import('three/addons/loaders/STLLoader.js')
  const geo = new STLLoader().parse(buffer)
  const flat = geo.index ? geo.toNonIndexed() : geo
  return new Float32Array(flat.getAttribute('position').array)
}

async function parseObj(text: string) {
  const [{ OBJLoader }, THREE] = await Promise.all([import('three/addons/loaders/OBJLoader.js'), import('three')])
  const group = new OBJLoader().parse(text)
  group.updateMatrixWorld(true)
  const chunks: Float32Array[] = []
  group.traverse((o) => {
    const mesh = o as InstanceType<typeof THREE.Mesh>
    if (!mesh.isMesh) return
    const geo = (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld)
    chunks.push(new Float32Array(geo.getAttribute('position').array))
  })
  return concat(chunks)
}

function concat(chunks: Float32Array[]) {
  const out = new Float32Array(chunks.reduce((s, c) => s + c.length, 0))
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  return out
}

/* ------------------------------------------------------------------ 3MF */

// Matriz 3MF: 12 números (linha a linha, 4×3). Ponto: [x y z 1] × M.
type Mat = number[]
const IDENTITY: Mat = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]

function parseMatrix(text: string | null): Mat {
  if (!text) return IDENTITY
  const n = text.trim().split(/\s+/).map(Number)
  return n.length === 12 && n.every(Number.isFinite) ? n : IDENTITY
}

/** a depois b (aplica a, depois b) */
function multiply(a: Mat, b: Mat): Mat {
  const r = new Array(12)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      r[row * 3 + col] =
        a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col] + (row === 3 ? b[9 + col] : 0)
    }
  }
  return r
}

const UNIT: Record<string, number> = { micron: 0.001, millimeter: 1, centimeter: 10, inch: 25.4, foot: 304.8, meter: 1000 }

// Nome sem prefixo de namespace ("p:path" → "path"), igual em qualquer navegador
const local = (name: string) => name.slice(name.indexOf(':') + 1)

function attr(el: Element, name: string) {
  if (el.hasAttribute(name)) return el.getAttribute(name)
  for (const a of Array.from(el.attributes)) if (local(a.name) === name) return a.value
  return null
}

function children(el: Element, name: string) {
  return Array.from(el.children).filter((c) => local(c.nodeName) === name)
}

function descendants(root: Document, name: string) {
  return Array.from(root.getElementsByTagName('*')).filter((c) => local(c.nodeName) === name)
}

export function parse3mf(bytes: Uint8Array, hinted: ModelFormat = '3mf'): ParsedModel {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new Error('Não deu para abrir o arquivo 3MF (ele parece corrompido).')
  }
  const byPath = new Map(Object.entries(files).map(([k, v]) => [k.replace(/^\/+/, '').toLowerCase(), v]))
  const read = (path: string) => byPath.get(path.replace(/^\/+/, '').toLowerCase())

  // arquivo principal: o que o _rels aponta, ou o padrão
  let main = '3D/3dmodel.model'
  const rels = read('_rels/.rels')
  if (rels) {
    const m = strFromU8(rels).match(/Target="([^"]+\.model)"/i)
    if (m) main = m[1]
  }

  const docs = new Map<string, Document>()
  const doc = (path: string) => {
    const key = path.replace(/^\/+/, '').toLowerCase()
    if (!docs.has(key)) {
      const data = read(key)
      if (!data) return null
      docs.set(key, new DOMParser().parseFromString(strFromU8(data), 'application/xml'))
    }
    return docs.get(key)!
  }

  const mainDoc = doc(main)
  const parts: Part[] = []
  if (mainDoc) {
    const scale = UNIT[mainDoc.documentElement.getAttribute('unit') ?? 'millimeter'] ?? 1
    const scaleMat: Mat = [scale, 0, 0, 0, scale, 0, 0, 0, scale, 0, 0, 0]

    const findObject = (path: string, id: string) => {
      const d = doc(path)
      if (!d) return null
      return descendants(d, 'object').find((o) => o.getAttribute('id') === id) ?? null
    }

    const collect = (path: string, id: string, m: Mat, out: number[], depth = 0) => {
      const obj = findObject(path, id)
      if (!obj || depth > 16) return
      const mesh = children(obj, 'mesh')[0]
      if (mesh) {
        const vs = children(mesh, 'vertices')[0]
        const ts = children(mesh, 'triangles')[0]
        if (!vs || !ts) return
        const verts = children(vs, 'vertex').map((v) => {
          const x = Number(v.getAttribute('x')), y = Number(v.getAttribute('y')), z = Number(v.getAttribute('z'))
          return [x * m[0] + y * m[3] + z * m[6] + m[9], x * m[1] + y * m[4] + z * m[7] + m[10], x * m[2] + y * m[5] + z * m[8] + m[11]]
        })
        for (const t of children(ts, 'triangle')) {
          for (const k of ['v1', 'v2', 'v3']) {
            const v = verts[Number(t.getAttribute(k))]
            if (v) out.push(v[0], v[1], v[2])
          }
        }
        return
      }
      const comps = children(obj, 'components')[0]
      if (!comps) return
      for (const c of children(comps, 'component')) {
        const cid = c.getAttribute('objectid')
        if (!cid) continue
        const cpath = attr(c, 'path') ?? path
        collect(cpath, cid, multiply(parseMatrix(c.getAttribute('transform')), m), out, depth + 1)
      }
    }

    const build = descendants(mainDoc, 'build')[0]
    for (const item of build ? children(build, 'item') : []) {
      const id = item.getAttribute('objectid')
      if (!id || item.getAttribute('printable') === '0') continue
      const out: number[] = []
      collect(main, id, multiply(parseMatrix(item.getAttribute('transform')), scaleMat), out)
      const name = findObject(main, id)?.getAttribute('name') ?? `Peça ${parts.length + 1}`
      if (out.length) parts.push({ name, positions: new Float32Array(out) })
    }
  }

  const plates = parseSliceInfo(read('Metadata/slice_info.config'), read)
  const format: ModelFormat = plates.length || hinted === 'gcode.3mf' ? 'gcode.3mf' : '3mf'
  return withStats(format, parts, plates)
}

/** Metadata/slice_info.config do Bambu Studio: tempo, gramas e filamentos por placa. */
export function parseSliceInfo(data: Uint8Array | undefined, read: (p: string) => Uint8Array | undefined = () => undefined): Plate[] {
  if (!data) return []
  const xml = new DOMParser().parseFromString(strFromU8(data), 'application/xml')
  const plates: Plate[] = []
  for (const plate of descendants(xml, 'plate')) {
    const meta = new Map(children(plate, 'metadata').map((m) => [m.getAttribute('key'), m.getAttribute('value')]))
    const index = Number(meta.get('index') ?? plates.length + 1)
    const seconds = Number(meta.get('prediction') ?? 0)
    if (!seconds) continue // projeto não fatiado: sem tempo calculado
    const filaments = children(plate, 'filament').map((f) => ({
      type: f.getAttribute('type') ?? '',
      color: normalizeColor(f.getAttribute('color')),
      grams: Number(f.getAttribute('used_g') ?? 0),
      meters: Number(f.getAttribute('used_m') ?? 0),
    }))
    const weight = Number(meta.get('weight') ?? 0) || filaments.reduce((s, f) => s + f.grams, 0)
    plates.push({
      index,
      minutes: Math.round(seconds / 60),
      grams: Math.round(weight * 100) / 100,
      filaments,
      objects: children(plate, 'object').map((o) => o.getAttribute('name') ?? '').filter(Boolean),
      thumbnail: read(`Metadata/plate_${index}.png`),
    })
  }
  return plates
}

function normalizeColor(c: string | null) {
  if (!c) return '#9aa1ab'
  const m = c.match(/^#?([0-9a-f]{6})/i)
  return m ? `#${m[1].toLowerCase()}` : '#9aa1ab'
}
