import { describe, expect, it } from 'vitest'
import type { PrintJob } from '@/lib/types'
import { schedule } from './schedule'

const job = (id: string, minutes: number, extra: Partial<PrintJob> = {}) => ({ id, print_minutes: minutes, started_at: null, ...extra }) as PrintJob

describe('schedule', () => {
  const now = Date.UTC(2026, 9, 22, 12, 0)
  it('encadeia a fila a partir de agora', () => {
    const r = schedule(undefined, [job('a', 60), job('b', 30)], now)
    expect(r.queue[0].startAt).toBe(now)
    expect(r.queue[1].startAt).toBe(now + 60 * 60_000)
    expect(r.endsAt).toBe(now + 90 * 60_000)
  })
  it('começa depois da placa que está imprimindo', () => {
    const running = job('r', 120, { started_at: new Date(now - 30 * 60_000).toISOString() })
    const r = schedule(running, [job('a', 60)], now)
    expect(r.current!.endAt).toBe(now + 90 * 60_000)
    expect(r.queue[0].startAt).toBe(now + 90 * 60_000)
  })
  it('placa atrasada termina "agora", não no passado', () => {
    const running = job('r', 60, { started_at: new Date(now - 120 * 60_000).toISOString() })
    expect(schedule(running, [], now).current!.endAt).toBe(now)
  })
})
