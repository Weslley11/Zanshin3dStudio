import { describe, expect, it } from 'vitest'
import { brl, date, daysUntil, duration, formatPhone, normalizePhone, parseDecimal, parseDuration } from './format'

describe('format', () => {
  it('moeda e números no padrão brasileiro', () => {
    expect(brl(1234.56)).toBe('R$ 1.234,56')
    expect(parseDecimal('1.234,56')).toBe(1234.56)
    expect(parseDecimal('12.5')).toBe(12.5)
    expect(parseDecimal('')).toBeNull()
  })
  it('tempo em h:min', () => {
    expect(parseDuration('5:20')).toBe(320)
    expect(parseDuration('5h')).toBe(300)
    expect(parseDuration('5h30')).toBe(330)
    expect(parseDuration('90min')).toBe(90)
    expect(parseDuration('1,5')).toBe(90)
    expect(duration(320)).toBe('5h 20min')
    expect(duration(45)).toBe('45min')
  })
  it('datas dd/mm/aaaa', () => {
    expect(date('2026-10-22')).toBe('22/10/2026')
    expect(daysUntil('2026-10-25', '2026-10-22')).toBe(3)
    expect(daysUntil('2026-10-20', '2026-10-22')).toBe(-2)
  })
  it('telefone', () => {
    expect(normalizePhone('(47) 99167-7070')).toBe('5547991677070')
    expect(formatPhone('5547991677070')).toBe('(47) 99167-7070')
  })
})
