import { ArrowLeft } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Button } from './button'

/** Volta para a tela anterior; se o link foi aberto direto, vai para a lista. */
export function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Voltar"
      className="-ml-2"
      onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback))}
    >
      <ArrowLeft />
    </Button>
  )
}
