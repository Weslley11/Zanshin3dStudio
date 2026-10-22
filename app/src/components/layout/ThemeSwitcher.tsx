import { Monitor, Moon, Sun } from '@phosphor-icons/react'
import { Segmented } from '@/components/ui/misc'
import { useTheme, type ThemePref } from '@/hooks/useTheme'

export function ThemeSwitcher() {
  const [pref, setPref] = useTheme()
  return (
    <Segmented<ThemePref>
      label="Tema"
      value={pref}
      onChange={setPref}
      options={[
        { value: 'system', label: <Monitor aria-label="Seguir o aparelho" /> },
        { value: 'dark', label: <Moon aria-label="Escuro" /> },
        { value: 'light', label: <Sun aria-label="Claro" /> },
      ]}
    />
  )
}
