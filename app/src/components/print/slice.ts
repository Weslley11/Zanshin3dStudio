/**
 * Fatiador da cena: corta a malha (triângulos soltos, Y para cima) em camadas
 * horizontais e devolve, para cada camada, `count` pontos (x, z) espalhados
 * ao longo do contorno, na ordem em que o bico percorreria. Serve para o
 * filete quente e para o caminho do cabeçote; sem three.js, dá para testar.
 */
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 0],
] as const

export function sliceLayers(pos: ArrayLike<number>, height: number, layers: number, count: number): Float32Array[] {
  const segs: number[][] = Array.from({ length: layers }, () => [])
  const step = height / layers
  const out = [0, 0, 0, 0]
  for (let i = 0; i + 8 < pos.length; i += 9) {
    const y0 = pos[i + 1]
    const y1 = pos[i + 4]
    const y2 = pos[i + 7]
    // camadas cujo meio (L + 0,5) × passo fica entre o ponto mais baixo e o mais alto
    const a = Math.max(0, Math.floor(Math.min(y0, y1, y2) / step - 0.5) + 1)
    const b = Math.min(layers - 1, Math.ceil(Math.max(y0, y1, y2) / step - 0.5) - 1)
    for (let L = a; L <= b; L++) {
      const y = (L + 0.5) * step
      let k = 0
      for (const [p, q] of EDGES) {
        const ya = pos[i + p * 3 + 1]
        const yb = pos[i + q * 3 + 1]
        if ((ya - y) * (yb - y) < 0 && k < 4) {
          const t = (y - ya) / (yb - ya)
          out[k++] = pos[i + p * 3] + t * (pos[i + q * 3] - pos[i + p * 3])
          out[k++] = pos[i + p * 3 + 2] + t * (pos[i + q * 3 + 2] - pos[i + p * 3 + 2])
        }
      }
      if (k === 4) segs[L].push(out[0], out[1], out[2], out[3])
    }
  }
  return segs.map((s) => sample(chain(s), count))
}

/** Junta segmentos que se tocam em linhas contínuas (x, z, x, z, ...). */
export function chain(s: number[]): number[][] {
  const n = s.length / 4
  const key = (x: number, z: number) => `${Math.round(x * 1e4)},${Math.round(z * 1e4)}`
  const ends = new Map<string, number[]>()
  for (let i = 0; i < n; i++) {
    for (let e = 0; e < 2; e++) {
      const k = key(s[i * 4 + e * 2], s[i * 4 + e * 2 + 1])
      const list = ends.get(k)
      if (list) list.push(i * 2 + e)
      else ends.set(k, [i * 2 + e])
    }
  }
  const used = new Uint8Array(n)
  const lines: number[][] = []
  for (let i = 0; i < n; i++) {
    if (used[i]) continue
    used[i] = 1
    const line = [s[i * 4], s[i * 4 + 1], s[i * 4 + 2], s[i * 4 + 3]]
    let x = s[i * 4 + 2]
    let z = s[i * 4 + 3]
    for (;;) {
      const next = ends.get(key(x, z))?.find((id) => !used[id >> 1])
      if (next === undefined) break
      const j = next >> 1
      const other = 1 - (next & 1)
      used[j] = 1
      x = s[j * 4 + other * 2]
      z = s[j * 4 + other * 2 + 1]
      line.push(x, z)
    }
    lines.push(line)
  }
  return lines
}

/** `count` pontos igualmente espaçados ao longo das linhas, na ordem delas. */
export function sample(lines: number[][], count: number): Float32Array {
  let total = 0
  for (const l of lines) for (let i = 2; i < l.length; i += 2) total += Math.hypot(l[i] - l[i - 2], l[i + 1] - l[i - 1])
  if (!total || !count) return new Float32Array(0)
  const res = new Float32Array(count * 2)
  const gap = total / count
  let target = gap / 2
  let acc = 0
  let k = 0
  for (const l of lines) {
    for (let i = 2; i < l.length && k < count; i += 2) {
      const len = Math.hypot(l[i] - l[i - 2], l[i + 1] - l[i - 1])
      while (k < count && target <= acc + len) {
        const t = len ? (target - acc) / len : 0
        res[k * 2] = l[i - 2] + t * (l[i] - l[i - 2])
        res[k * 2 + 1] = l[i - 1] + t * (l[i + 1] - l[i - 1])
        k++
        target += gap
      }
      acc += len
    }
  }
  // arredondamento no fim: repete o último ponto
  for (; k < count; k++) {
    res[k * 2] = res[(k - 1) * 2]
    res[k * 2 + 1] = res[(k - 1) * 2 + 1]
  }
  return res
}
