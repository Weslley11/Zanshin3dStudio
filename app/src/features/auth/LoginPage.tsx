import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Logo } from '@/components/layout/Logo'
import { errorMessage, supabase, supabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (auth.status === 'owner') return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setError(errorMessage(error))
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="animate-enter w-full max-w-sm">
        <Logo className="mb-8" />
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-fg-muted">Área interna da Zanshin 3D Studio.</p>

        {!supabaseConfigured ? (
          <div role="alert" className="mt-6 rounded-ui border border-border bg-surface p-4 text-sm text-fg-muted">
            O app ainda não está ligado ao Supabase. Crie o arquivo <code className="text-fg">.env</code> a partir do{' '}
            <code className="text-fg">.env.example</code> com a URL e a chave anon do projeto.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <Field label="E-mail">
              {(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Field label="Senha">
              {(p) => (
                <Input {...p} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              )}
            </Field>
            {(error || (auth.status === 'signed-out' && auth.denied) || auth.status === 'error') && (
              <p role="alert" className="text-sm text-danger">
                {error ?? (auth.status === 'error' ? auth.message : 'Esta conta não tem acesso. O app é só do dono do estúdio.')}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              Entrar
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
