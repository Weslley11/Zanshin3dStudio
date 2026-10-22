import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { errorMessage, supabase } from '@/lib/supabase'

const OWNER_HINT = 'zanshin-owner'
function readOwnerHint() {
  try {
    return localStorage.getItem(OWNER_HINT)
  } catch {
    return null
  }
}
function writeOwnerHint(id: string | null) {
  try {
    if (id) localStorage.setItem(OWNER_HINT, id)
    else localStorage.removeItem(OWNER_HINT)
  } catch {
    /* modo privado */
  }
}

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out'; denied?: boolean }
  | { status: 'owner'; session: Session }
  | { status: 'error'; message: string }

const AuthContext = createContext<AuthState>({ status: 'loading' })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let current: string | null = null
    let denied = false

    async function resolve(session: Session | null) {
      if (!session) {
        current = null
        writeOwnerHint(null)
        setState({ status: 'signed-out', denied })
        denied = false
        return
      }
      if (current === session.user.id) return
      current = session.user.id
      // O primeiro login vira o dono; os seguintes só confirmam.
      const { data, error } = await supabase.rpc('claim_ownership')
      if (error) {
        // sem internet: se este usuário já foi confirmado como dono neste
        // aparelho, abre o app (os dados seguem protegidos pelo RLS)
        if (readOwnerHint() === session.user.id) setState({ status: 'owner', session })
        else setState({ status: 'error', message: errorMessage(error) })
      } else if (data) {
        writeOwnerHint(session.user.id)
        setState({ status: 'owner', session })
      } else {
        // conta sem acesso: encerra a sessão e avisa na tela de login
        denied = true
        await supabase.auth.signOut()
      }
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // fora do callback para não travar o cliente do Supabase
      setTimeout(() => resolve(session), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
