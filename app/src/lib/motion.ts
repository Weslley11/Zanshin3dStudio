/** Movimento do app: rápido no começo, suave no fim, sem quique. */
export const ease = [0.22, 1, 0.36, 1] as const

/** Mola firme para coisas que se deslocam (indicador de aba, cartões, folhas). */
export const spring = { type: 'spring', stiffness: 520, damping: 42, mass: 0.9 } as const

/** Atraso em cascata para listas: até 12 itens, depois todos juntos. */
export const stagger = (i: number) => Math.min(i, 12) * 0.03

/** Recursos completos do Motion (layout e arrastar), baixados à parte. */
export const loadMotionFeatures = () => import('./motionFeatures').then((m) => m.default)
