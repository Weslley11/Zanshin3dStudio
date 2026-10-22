import { useCallback, useEffect, useState } from 'react'

export type ThemePref = 'system' | 'dark' | 'light'
const KEY = 'zanshin-theme'

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#131519' : '#eceef1')
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => {
    try {
      return (localStorage.getItem(KEY) as ThemePref) || 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    apply(pref)
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const update = useCallback((p: ThemePref) => {
    try {
      localStorage.setItem(KEY, p)
    } catch {
      /* modo privado: vale só nesta sessão */
    }
    setPref(p)
  }, [])

  return [pref, update] as const
}
