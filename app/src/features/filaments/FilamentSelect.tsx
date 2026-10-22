import { Select } from '@/components/ui/field'
import { grams } from '@/lib/format'
import type { Filament } from '@/lib/types'

export function filamentLabel(f: Pick<Filament, 'material' | 'color_name' | 'brand'>) {
  return `${f.material} ${f.color_name} · ${f.brand}`
}

/** Escolha de carretel: só os ativos, mais o atual se tiver sido arquivado. */
export function FilamentSelect({
  filaments,
  value,
  onChange,
  allowEmpty = 'Sem carretel',
  ...props
}: {
  filaments: Filament[]
  value: string | null
  onChange: (id: string | null) => void
  allowEmpty?: string | false
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}) {
  const list = filaments.filter((f) => !f.archived || f.id === value)
  return (
    <Select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} {...props}>
      {allowEmpty !== false && <option value="">{allowEmpty}</option>}
      {list.map((f) => (
        <option key={f.id} value={f.id}>
          {filamentLabel(f)} ({grams(f.remaining_g)})
        </option>
      ))}
    </Select>
  )
}
