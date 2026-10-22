import { TIMEZONE } from './constants'

const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** R$ 1.234,56 */
export function brl(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return 'R$ --'
  return brlFmt.format(value).replace(/ /g, ' ')
}

export function number(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return '--'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function grams(value: number | null | undefined) {
  if (value == null) return '-- g'
  if (Math.abs(value) >= 1000) return `${number(value / 1000, 2)} kg`
  return `${number(value, value % 1 ? 1 : 0)} g`
}

export function percent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '--'
  return `${number(value, digits)}%`
}

/** 320 → "5h 20min" */
export function duration(minutes: number | null | undefined) {
  if (minutes == null) return '--'
  const m = Math.round(minutes)
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${r}min`
  if (r === 0) return `${h}h`
  return `${h}h ${String(r).padStart(2, '0')}min`
}

/** 320 → "5:20" (para campos h:min) */
export function hhmm(minutes: number | null | undefined) {
  if (minutes == null) return ''
  const h = Math.floor(minutes / 60)
  const r = Math.round(minutes % 60)
  return `${h}:${String(r).padStart(2, '0')}`
}

/** "5:20", "5h20", "5,5" ou "90min" → minutos */
export function parseDuration(text: string): number | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  let m = t.match(/^(\d+)\s*[:h]\s*(\d{1,2})?\s*(min)?$/)
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0)
  m = t.match(/^(\d+)\s*min$/)
  if (m) return Number(m[1])
  const n = parseDecimal(t)
  return n == null ? null : Math.round(n * 60)
}

/** "1.234,56" ou "1234.56" → 1234.56 */
export function parseDecimal(text: string | number | null | undefined): number | null {
  if (text == null) return null
  if (typeof text === 'number') return Number.isFinite(text) ? text : null
  let t = text.trim().replace(/^R\$\s*/i, '').replace(/\s/g, '')
  if (!t) return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Valor para exibir num campo editável: 1234.5 → "1234,50" */
export function decimalInput(value: number | null | undefined, digits = 2) {
  if (value == null) return ''
  return value.toFixed(digits).replace('.', ',')
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
const isoDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

/** dd/mm/aaaa. Aceita "2026-10-22" (data pura, sem fuso) ou timestamp. */
export function date(value: string | Date | null | undefined) {
  if (!value) return '--'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }
  return dateFmt.format(new Date(value))
}

export function dateTime(value: string | Date | null | undefined) {
  if (!value) return '--'
  return dateTimeFmt.format(new Date(value)).replace(',', ' às')
}

export function time(value: string | Date | null | undefined) {
  if (!value) return '--'
  return timeFmt.format(new Date(value))
}

/** Data de hoje (aaaa-mm-dd) no fuso de São Paulo */
export function todayISO(now = new Date()) {
  return isoDateFmt.format(now)
}

export function toISODate(d: Date) {
  return isoDateFmt.format(d)
}

export function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** Dias entre hoje e a data (negativo = atrasado) */
export function daysUntil(iso: string, today = todayISO()) {
  const utc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(iso) - utc(today)) / 86_400_000)
}

/** "Hoje 14:30", "Amanhã 09:10" ou "24/10 às 18:00" */
export function relativeDateTime(value: Date) {
  const today = todayISO()
  const iso = toISODate(value)
  const t = time(value)
  const diff = daysUntil(iso, today)
  if (diff === 0) return `Hoje ${t}`
  if (diff === 1) return `Amanhã ${t}`
  return `${date(value).slice(0, 5)} às ${t}`
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const s = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function docNumber(n: number | null | undefined) {
  if (n == null) return 'ZAN-....'
  return `ZAN-${String(n).padStart(4, '0')}`
}

export function onlyDigits(text: string | null | undefined) {
  return (text ?? '').replace(/\D/g, '')
}

/** Normaliza para 55 + DDD + número. "(47) 99167-7070" → "5547991677070" */
export function normalizePhone(text: string | null | undefined) {
  const d = onlyDigits(text)
  if (!d) return null
  if (d.length === 10 || d.length === 11) return `55${d}`
  return d
}

/** "5547991677070" → "(47) 99167-7070" */
export function formatPhone(digits: string | null | undefined) {
  let d = onlyDigits(digits)
  if (!d) return ''
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

export function cleanInstagram(text: string | null | undefined) {
  const t = (text ?? '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '')
  return t || null
}
