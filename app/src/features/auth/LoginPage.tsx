import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Logo } from '@/components/layout/Logo'
import { PrintStage } from '@/components/print/PrintStage'
import { LAYERS, pieceLabel, PIECES, type PieceId } from '@/components/print/timeline'
import { errorMessage, supabase, supabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [layer, setLayer] = useState(0)
  const [piece, setPiece] = useState<PieceId>(PIECES[0].id)

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
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <PrintStage
        framing="hero"
        onLayer={(l, id) => {
          setLayer(l)
          setPiece(id)
        }}
        sceneClassName="print-fade-hero"
        className="h-[40dvh] max-h-[26rem] min-h-56 border-b border-border bg-bg lg:h-auto lg:max-h-none lg:border-r lg:border-b-0"
      >
        <div className="absolute right-4 bottom-4 left-4 lg:right-8 lg:bottom-8 lg:left-8" aria-hidden>
          <p className="eyebrow num text-fg-muted">
            Imprimindo {pieceLabel(piece)} · camada <span className="text-fg">{String(layer).padStart(3, '0')}</span> / {LAYERS}
          </p>
          <div className="mt-2 h-0.5 w-44 overflow-hidden rounded-full bg-border">
            <i className="block h-full origin-left bg-accent" style={{ transform: `scaleX(${layer / LAYERS})` }} />
          </div>
        </div>
      </PrintStage>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="animate-enter w-full max-w-sm">
          <Logo className="mb-8" />
          <p className="eyebrow text-fg-muted">Área interna</p>
          <h1 className="title-display mt-1 text-4xl">Entrar</h1>

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
    </div>
  )
}
