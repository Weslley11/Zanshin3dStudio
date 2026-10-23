/** Medidas de uma malha em triângulos soltos (x,y,z em mm, Z para cima). */
export type Stats = {
  sizeX: number
  sizeY: number
  sizeZ: number
  volumeCm3: number
  areaCm2: number
  triangles: number
}

export function computeStats(positions: Float32Array): Stats {
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  let volume = 0
  let area = 0
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i], ay = positions[i + 1], az = positions[i + 2]
    const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5]
    const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8]
    minX = Math.min(minX, ax, bx, cx); maxX = Math.max(maxX, ax, bx, cx)
    minY = Math.min(minY, ay, by, cy); maxY = Math.max(maxY, ay, by, cy)
    minZ = Math.min(minZ, az, bz, cz); maxZ = Math.max(maxZ, az, bz, cz)
    // volume: soma dos tetraedros com a origem (malha fechada)
    volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6
    // área: metade do produto vetorial
    const ux = bx - ax, uy = by - ay, uz = bz - az
    const vx = cx - ax, vy = cy - ay, vz = cz - az
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    area += Math.sqrt(nx * nx + ny * ny + nz * nz) / 2
  }
  const triangles = positions.length / 9
  if (!triangles) return { sizeX: 0, sizeY: 0, sizeZ: 0, volumeCm3: 0, areaCm2: 0, triangles: 0 }
  return {
    sizeX: maxX - minX,
    sizeY: maxY - minY,
    sizeZ: maxZ - minZ,
    volumeCm3: Math.abs(volume) / 1000,
    areaCm2: area / 100,
    triangles,
  }
}

/** Densidade típica de cada material (g/cm³). */
export const DENSITY: Record<string, number> = { PLA: 1.24, PETG: 1.27, ABS: 1.04, ASA: 1.07, TPU: 1.21 }

/**
 * Estimativa de gramas sem fatiar: as paredes e o topo/fundo são cheios
 * (área × espessura) e o miolo entra pela porcentagem de preenchimento.
 * Serve para orçar rápido; o número de verdade vem do fatiador.
 */
export function estimateGrams({ volumeCm3, areaCm2, density, infillPct, wallMm }: {
  volumeCm3: number
  areaCm2: number
  density: number
  infillPct: number
  wallMm: number
}) {
  const shell = Math.min(volumeCm3, areaCm2 * (wallMm / 10))
  const interior = Math.max(0, volumeCm3 - shell)
  return density * (shell + interior * (infillPct / 100))
}

/** Cabe na mesa? Testa deitado como está e girado 90° no plano. */
export function fitsBed(s: Pick<Stats, 'sizeX' | 'sizeY' | 'sizeZ'>, bed: { x: number; y: number; z: number }) {
  const flat = (s.sizeX <= bed.x && s.sizeY <= bed.y) || (s.sizeY <= bed.x && s.sizeX <= bed.y)
  return flat && s.sizeZ <= bed.z
}
