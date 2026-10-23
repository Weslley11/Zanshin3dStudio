import { useEffect, type ReactNode } from 'react'
import { m, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { ease, stagger } from '@/lib/motion'

/** Entrada suave de um item de lista, em cascata pelo índice. */
export function FadeIn({ index = 0, children, className, as = 'div' }: { index?: number; children: ReactNode; className?: string; as?: 'div' | 'li' | 'section' }) {
  const Comp = as === 'li' ? m.li : as === 'section' ? m.section : m.div
  return (
    <Comp className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease, delay: stagger(index) }}>
      {children}
    </Comp>
  )
}

/** Número que conta até o valor novo (faturamento, totais). */
export function AnimatedNumber({ value, format, from0 = false }: { value: number; format: (n: number) => string; from0?: boolean }) {
  const reduce = useReducedMotion()
  const mv = useSpring(from0 ? 0 : value, { stiffness: 170, damping: 26 })
  const text = useTransform(mv, (v) => format(v))
  useEffect(() => {
    mv.set(value)
  }, [mv, value])
  if (reduce) return <span>{format(value)}</span>
  return <m.span>{text}</m.span>
}

/** Barra que enche até a porcentagem (carretel, impressão). */
export function ProgressFill({ pct, className, style }: { pct: number; className?: string; style?: React.CSSProperties }) {
  return (
    <m.div
      className={className}
      style={style}
      initial={{ width: 0 }}
      animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      transition={{ duration: 0.7, ease }}
    />
  )
}
