import { Navigate, Outlet } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from './AuthProvider'

export function RequireOwner() {
  const auth = useAuth()
  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true" aria-label="Carregando">
        <Logo withText={false} className="animate-pulse" />
      </div>
    )
  }
  if (auth.status !== 'owner') return <Navigate to="/login" replace />
  return <Outlet />
}
