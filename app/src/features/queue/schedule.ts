import type { PrintJob } from '@/lib/types'

export type Scheduled<T extends PrintJob = PrintJob> = T & { startAt: number; endAt: number }

/**
 * Previsão encadeada a partir de agora: a placa imprimindo termina em
 * início + tempo estimado (ou agora, se já passou); cada placa da fila começa
 * quando a anterior termina.
 */
export function schedule<T extends PrintJob>(running: T | undefined, queued: T[], now: number) {
  let cursor = now
  let current: Scheduled<T> | undefined
  if (running) {
    const start = running.started_at ? new Date(running.started_at).getTime() : now
    const end = Math.max(now, start + running.print_minutes * 60_000)
    current = { ...running, startAt: start, endAt: end }
    cursor = end
  }
  const list = queued.map((j) => {
    const s = { ...j, startAt: cursor, endAt: cursor + j.print_minutes * 60_000 }
    cursor = s.endAt
    return s
  })
  return { current, queue: list, endsAt: cursor }
}
