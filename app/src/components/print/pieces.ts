import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { sliceLayers } from './slice'
import type { PieceId } from './timeline'

/**
 * Peças da cena, montadas com formas simples do three.js. Cada uma vira uma
 * malha só (um filamento, uma cor), apoiada na mesa (y = 0), centralizada e
 * já fatiada em camadas para o bico seguir o contorno.
 */
export type Piece = {
  geometry: THREE.BufferGeometry
  edges: THREE.BufferGeometry
  height: number
  /** maior distância do eixo de giro */
  radius: number
  /** quanto a câmera olha de cima (peça baixa pede mais) */
  elev: number
  /** giro da mesa em que a peça aparece melhor (quadro parado e começo do giro) */
  pose: number
  layers: Float32Array[]
}

export const RING = 220
const SLICES = 160
const MAX_H = 3.1
const MAX_W = 3.8

type Parts = THREE.BufferGeometry[]
type P2 = [number, number]

function m4(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz))
}

function put(parts: Parts, g: THREE.BufferGeometry, m?: THREE.Matrix4) {
  if (m) g.applyMatrix4(m)
  const flat = g.index ? g.toNonIndexed() : g
  if (flat !== g) g.dispose()
  for (const name of Object.keys(flat.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') flat.deleteAttribute(name)
  flat.clearGroups()
  parts.push(flat)
}

/** Perfil no plano XY, extrudado em Z e centralizado na espessura. */
function extrude(points: P2[], depth: number, bevel = 0) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const inner = depth - 2 * bevel
  const g = new THREE.ExtrudeGeometry(shape, { depth: inner, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 12 })
  g.translate(0, 0, -inner / 2)
  return g
}

function rod(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const d = new THREE.Vector3().subVectors(b, a)
  const g = new THREE.CylinderGeometry(r, r, d.length(), 8)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)))
  return g
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Elmo samurai: tigela com gomos, aba, protetor de nuca em lâminas e a lua crescente na frente. */
function kabuto(parts: Parts) {
  const profile: P2[] = [
    [1.0, 0.62],
    [1.0, 0.76],
    [0.97, 0.95],
    [0.9, 1.12],
    [0.78, 1.27],
    [0.6, 1.39],
    [0.38, 1.46],
    [0.16, 1.495],
    [0, 1.5],
  ]
  const bowl = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    168,
  )
  // gomos (suji) que somem perto do topo
  const p = bowl.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    const k = 1 + 0.024 * Math.cos(24 * Math.atan2(x, z)) * Math.min(1, (1.5 - p.getY(i)) * 3)
    p.setX(i, x * k)
    p.setZ(i, z * k)
  }
  bowl.computeVertexNormals()
  put(parts, bowl)
  put(parts, new THREE.TorusGeometry(0.13, 0.035, 10, 36), m4(0, 1.5, 0, Math.PI / 2))
  put(parts, new THREE.CylinderGeometry(1.035, 1.035, 0.12, 96, 1, true), m4(0, 0.68, 0))
  // aba da frente
  put(parts, new THREE.CylinderGeometry(1.04, 1.3, 0.14, 64, 1, true, -1.15, 2.3), m4(0, 0.57, 0))
  // protetor de nuca: quatro lâminas abrindo para baixo, livres na frente
  for (let i = 0; i < 4; i++) {
    const top = 1.03 + i * 0.1
    put(parts, new THREE.CylinderGeometry(top, top + 0.12, 0.2, 80, 1, true, 0.95, Math.PI * 2 - 1.9), m4(0, 0.53 - i * 0.17, 0))
  }
  // abas viradas para fora nas pontas da nuca
  for (const s of [-1, 1]) put(parts, new THREE.BoxGeometry(0.36, 0.32, 0.035), m4(s * 1.0, 0.5, 0.62, 0, s * 0.5, s * -0.12))
  // lua crescente (maedate) sobre um suporte
  const W = 1.35
  const D = 1.0
  const d = 0.8
  const N = 40
  const moon: P2[] = []
  for (let i = 0; i <= N; i++) {
    const u = -1 + (2 * i) / N
    moon.push([u * W, -D * (1 - u * u)])
  }
  for (let i = N - 1; i >= 1; i--) {
    const u = -1 + (2 * i) / N
    moon.push([u * W, -d * (1 - u * u)])
  }
  put(parts, extrude(moon, 0.06, 0.012), m4(0, 0.78 + D, 1.1, -0.22))
  put(parts, new THREE.BoxGeometry(0.2, 0.18, 0.12), m4(0, 0.74, 1.05))
  return { elev: 0.3, pose: -0.35 }
}

/** Carro de corrida de roda descoberta, sem marca: bico, laterais, asas, halo e rodas. */
function f1(parts: Parts) {
  // corpo visto de lado (x para a frente)
  const body: P2[] = [
    [2.05, 0.15],
    [2.08, 0.21],
    [1.4, 0.32],
    [0.75, 0.42],
    [0.45, 0.48],
    [0.38, 0.41],
    [-0.02, 0.41],
    [-0.12, 0.66],
    [-0.42, 0.66],
    [-1.15, 0.38],
    [-1.6, 0.32],
    [-1.6, 0.12],
    [1.2, 0.12],
  ]
  put(parts, extrude(body, 0.42, 0.04))
  const pods: P2[] = [
    [0.55, 0.14],
    [0.55, 0.34],
    [0.2, 0.38],
    [-0.6, 0.33],
    [-1.25, 0.2],
    [-1.25, 0.14],
  ]
  put(parts, extrude(pods, 1.2, 0.06))
  put(parts, new THREE.BoxGeometry(2.9, 0.04, 1.35), m4(-0.3, 0.08, 0))
  // rodas: dianteiras mais finas, traseiras mais largas, com cubo
  for (const s of [-1, 1]) {
    put(parts, new THREE.CylinderGeometry(0.33, 0.33, 0.3, 40), m4(1.3, 0.33, s * 0.82, Math.PI / 2))
    put(parts, new THREE.CylinderGeometry(0.12, 0.12, 0.34, 16), m4(1.3, 0.33, s * 0.82, Math.PI / 2))
    put(parts, new THREE.CylinderGeometry(0.36, 0.36, 0.42, 40), m4(-1.3, 0.36, s * 0.85, Math.PI / 2))
    put(parts, new THREE.CylinderGeometry(0.13, 0.13, 0.46, 16), m4(-1.3, 0.36, s * 0.85, Math.PI / 2))
    // suspensão
    put(parts, rod(v(1.15, 0.3, s * 0.2), v(1.3, 0.34, s * 0.7), 0.022))
    put(parts, rod(v(1.45, 0.22, s * 0.2), v(1.3, 0.3, s * 0.7), 0.022))
    put(parts, rod(v(-1.05, 0.3, s * 0.55), v(-1.3, 0.38, s * 0.66), 0.024))
  }
  // asa dianteira: plano, flap e placas laterais
  put(parts, new THREE.BoxGeometry(0.42, 0.03, 1.9), m4(2.0, 0.09, 0))
  put(parts, new THREE.BoxGeometry(0.25, 0.025, 1.7), m4(1.86, 0.15, 0, 0, 0, 0.35))
  for (const s of [-1, 1]) put(parts, new THREE.BoxGeometry(0.5, 0.2, 0.025), m4(1.95, 0.15, s * 0.95))
  // asa traseira
  put(parts, new THREE.BoxGeometry(0.32, 0.035, 1.1), m4(-1.62, 0.78, 0))
  put(parts, new THREE.BoxGeometry(0.2, 0.03, 1.1), m4(-1.5, 0.86, 0, 0, 0, -0.4))
  put(parts, new THREE.BoxGeometry(0.2, 0.03, 1.0), m4(-1.55, 0.36, 0))
  for (const s of [-1, 1]) put(parts, new THREE.BoxGeometry(0.5, 0.55, 0.025), m4(-1.6, 0.62, s * 0.56))
  put(parts, new THREE.BoxGeometry(0.08, 0.36, 0.06), m4(-1.5, 0.52, 0))
  // halo, pilar e capacete do piloto
  const halo = new THREE.CatmullRomCurve3([v(0.45, 0.63, 0), v(0.3, 0.645, 0.26), v(-0.05, 0.635, 0.25), v(-0.18, 0.62, 0), v(-0.05, 0.635, -0.25), v(0.3, 0.645, -0.26)], true)
  put(parts, new THREE.TubeGeometry(halo, 64, 0.03, 8, true))
  put(parts, rod(v(0.45, 0.63, 0), v(0.62, 0.43, 0), 0.03))
  put(parts, new THREE.SphereGeometry(0.11, 16, 12), m4(0.18, 0.5, 0))
  return { elev: 0.42, pose: 0.6 }
}

/** Kunai em pé: argola, cabo trançado, colar e lâmina em losango. */
function kunai(parts: Parts) {
  put(parts, new THREE.TorusGeometry(0.34, 0.075, 14, 48), m4(0, 0.415, 0))
  put(parts, new THREE.CylinderGeometry(0.075, 0.095, 0.14, 24), m4(0, 0.84, 0))
  const grip = new THREE.CylinderGeometry(0.105, 0.105, 1.15, 48, 60)
  const p = grip.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const th = Math.atan2(x, z)
    // trama em losango de duas fitas cruzadas
    const w = 0.5 * (Math.abs(Math.sin(2 * th + 16 * y)) + Math.abs(Math.sin(2 * th - 16 * y)))
    const k = 0.92 + 0.12 * w
    p.setX(i, x * k)
    p.setZ(i, z * k)
  }
  grip.computeVertexNormals()
  put(parts, grip, m4(0, 1.475, 0))
  put(parts, new THREE.CylinderGeometry(0.15, 0.13, 0.08, 32), m4(0, 2.08, 0))
  const blade: P2[] = [
    [0, 2.1],
    [0.1, 2.12],
    [0.2, 2.32],
    [0.28, 2.6],
    [0.29, 2.78],
    [0.24, 3.15],
    [0.14, 3.62],
    [0, 4.15],
  ]
  // torno com 4 lados = seção em losango; achatado vira lâmina com nervura
  const b = new THREE.LatheGeometry(
    blade.map(([r, y]) => new THREE.Vector2(r, y)),
    4,
  )
  b.applyMatrix4(m4(0, 0, 0, 0, 0, 0, 1, 1, 0.28))
  const flat = b.toNonIndexed()
  b.dispose()
  flat.computeVertexNormals()
  put(parts, flat)
  return { elev: 0.2, pose: 0.25 }
}

const BUILDERS: Record<PieceId, (parts: Parts) => { elev: number; pose: number }> = { kabuto, f1, kunai }

export function buildPiece(id: PieceId): Piece {
  const parts: Parts = []
  const { elev, pose } = BUILDERS[id](parts)
  const geometry = mergeGeometries(parts, false)
  for (const g of parts) g.dispose()
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const s = Math.min(MAX_H / (box.max.y - box.min.y), MAX_W / Math.max(box.max.x - box.min.x, box.max.z - box.min.z))
  geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2)
  geometry.scale(s, s, s)

  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  let radius = 0
  let height = 0
  for (let i = 0; i < pos.count; i++) {
    radius = Math.max(radius, Math.hypot(pos.getX(i), pos.getZ(i)))
    height = Math.max(height, pos.getY(i))
  }
  // v pela altura: o relevo de camadas fica sempre na horizontal
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + pos.getZ(i)) * 0.5, pos.getY(i) / height)
  geometry.computeBoundingSphere()

  return {
    geometry,
    edges: new THREE.EdgesGeometry(geometry, 20),
    height,
    radius,
    elev,
    pose,
    layers: sliceLayers(pos.array, height, SLICES, RING),
  }
}
