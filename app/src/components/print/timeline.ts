/**
 * Tempo da cena de impressão, sem three.js (testável e leve).
 * As peças têm LAYERS camadas só na demonstração; numa placa de verdade o app
 * mostra porcentagem e horário, nunca uma contagem de camadas inventada.
 */
export const LAYERS = 240

/** Peças da cena, geradas por código (nada de personagens ou marcas). */
export const PIECES = [
  { id: 'kabuto', label: 'kabuto samurai' },
  { id: 'f1', label: 'carro de F1' },
  { id: 'kunai', label: 'kunai ninja' },
] as const
export type PieceId = (typeof PIECES)[number]['id']

export const pieceLabel = (id: PieceId) => PIECES.find((p) => p.id === id)!.label

/** A mesma placa sempre mostra a mesma peça. */
export function pieceFor(seed: string): PieceId {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return PIECES[Math.abs(h) % PIECES.length].id
}

/** Demonstração em loop: imprime, mostra pronta, apaga e passa para a próxima peça (segundos). */
export const DEMO = { print: 16, hold: 3, fade: 0.6 }
const CYCLE = DEMO.print + DEMO.hold + DEMO.fade

const easeInOut = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3

/** Progresso (0 a 1), opacidade e peça da vez no segundo t da demonstração. */
export function demoState(t: number) {
  const cycle = Math.floor(Math.max(0, t) / CYCLE)
  const piece = PIECES[cycle % PIECES.length].id
  const tc = Math.max(0, t) - cycle * CYCLE
  if (tc < DEMO.print) return { p: easeInOut(tc / DEMO.print), opacity: 1, piece }
  if (tc < DEMO.print + DEMO.hold) return { p: 1, opacity: 1, piece }
  return { p: 1, opacity: 1 - (tc - DEMO.print - DEMO.hold) / DEMO.fade, piece }
}

export const layerOf = (p: number) => Math.round(Math.min(1, Math.max(0, p)) * LAYERS)

/** Fração já impressa de uma placa, pelo início e pelo tempo estimado. */
export function jobProgress(startAt: number, printMinutes: number, now: number) {
  if (!printMinutes) return 0
  return Math.min(0.995, Math.max(0, (now - startAt) / (printMinutes * 60_000)))
}
