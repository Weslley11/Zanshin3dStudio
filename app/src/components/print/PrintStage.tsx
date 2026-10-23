import { lazy, Suspense, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { PrintSceneProps } from './PrintScene'

// o three.js só baixa quando alguma tela mostra a cena
const PrintScene = lazy(() => import('./PrintScene'))

/**
 * Palco da cena de impressão: linhas de camada no fundo (ficam sozinhas se o
 * aparelho não tiver WebGL) e o vaso 3D por cima. Decorativo para leitores de
 * tela; quem usa a cena mostra o progresso em texto ao lado.
 */
export function PrintStage({
  className,
  sceneClassName,
  children,
  ...scene
}: Omit<PrintSceneProps, 'className'> & { className?: string; sceneClassName?: string; children?: ReactNode }) {
  return (
    <div className={cn('layer-lines relative isolate overflow-hidden', className)}>
      <div className="absolute inset-0" aria-hidden>
        <Suspense fallback={null}>
          <PrintScene {...scene} className={sceneClassName} />
        </Suspense>
      </div>
      {children}
    </div>
  )
}
