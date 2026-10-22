import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Aceita o endereço copiado de qualquer tela do Supabase: com /rest/v1 no fim,
 * barra sobrando ou espaço colado junto, fica só https://<projeto>.supabase.co.
 */
export function projectUrl(raw: string | undefined) {
  const t = raw?.trim()
  if (!t) return undefined
  try {
    return new URL(t).origin
  } catch {
    return t
  }
}

const url = projectUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || undefined

export const supabaseConfigured = Boolean(url && key)

export const supabase = createClient<Database>(url ?? 'http://localhost', key ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const PHOTO_BUCKET = 'photos'

export function photoUrl(path: string | null | undefined) {
  if (!path) return null
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Envia uma foto com nome aleatório (o caminho é o que protege a foto pública). */
export async function uploadPhoto(folder: string, file: File) {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  })
  if (error) throw error
  return path
}

/** Mensagem legível para erros do Supabase/Postgres. */
export function errorMessage(err: unknown): string {
  if (!err) return 'Erro desconhecido'
  if (typeof err === 'string') return err
  const e = err as { message?: string; code?: string }
  if (e.code === '23505') return 'Já existe um registro com esses dados.'
  if (e.code === '23503') return 'Este registro está em uso em outro lugar.'
  if (e.code === '42501') return 'Sem permissão para esta ação.'
  if (e.message?.includes('Failed to fetch')) return 'Sem conexão com o servidor. Confira a internet e tente de novo.'
  if (e.message === 'Invalid login credentials') return 'E-mail ou senha incorretos.'
  return e.message ?? 'Erro desconhecido'
}
