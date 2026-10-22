import { onlyDigits } from './format'

/** Link wa.me com o texto já preenchido. Sem número, abre para escolher o contato. */
export function waLink(phone: string | null | undefined, text?: string) {
  const d = onlyDigits(phone)
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return d ? `https://wa.me/${d}${q}` : `https://wa.me/${q}`
}

export function igLink(user: string | null | undefined) {
  return user ? `https://instagram.com/${user}` : null
}
