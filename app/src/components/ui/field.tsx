import { useEffect, useId, useState, type ComponentProps, type ReactNode } from 'react'
import { CalendarBlank, CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { decimalInput, hhmm, parseDecimal, parseDuration } from '@/lib/format'

const control =
  'w-full rounded-ui border border-border-strong bg-surface px-3 text-[15px] text-fg transition-colors placeholder:text-fg-subtle hover:border-fg-subtle focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60 aria-[invalid=true]:border-danger'

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium text-fg', className)} {...props} />
}

/** Label sempre acima do campo, dica e erro abaixo. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  optional,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  optional?: boolean
  className?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}) {
  const id = useId()
  const descId = hint || error ? `${id}-desc` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-fg-subtle">(opcional)</span>}
      </Label>
      {children({ id, 'aria-describedby': descId, 'aria-invalid': error ? true : undefined })}
      {(error || hint) && (
        <p id={descId} className={cn('text-xs', error ? 'text-danger' : 'text-fg-subtle')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-20 py-2.5 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-11 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <CaretDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
    </div>
  )
}

/** Campo com unidade fixa (R$, g, %, kW) e teclado numérico no celular. */
export function NumberInput({
  value,
  onValueChange,
  prefix,
  suffix,
  digits = 2,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'prefix'> & {
  value: number | null
  onValueChange: (v: number | null) => void
  prefix?: string
  suffix?: string
  digits?: number
}) {
  // dinheiro sempre com dois decimais; o resto sem zeros sobrando (0,2 kW, 1000 g)
  const show = (v: number | null) =>
    v == null ? '' : prefix === 'R$' ? decimalInput(v, 2) : String(Number(v.toFixed(digits))).replace('.', ',')
  const [text, setText] = useState(() => show(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(show(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused])

  return (
    <div className="relative flex items-center">
      {prefix && <span className="pointer-events-none absolute left-3 text-sm text-fg-muted">{prefix}</span>}
      <input
        inputMode="decimal"
        autoComplete="off"
        className={cn(control, 'num h-11', prefix && 'pl-10', suffix && 'pr-12', className)}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d.,-]/g, '')
          setText(t)
          onValueChange(parseDecimal(t))
        }}
        {...props}
      />
      {suffix && <span className="pointer-events-none absolute right-3 text-sm text-fg-muted">{suffix}</span>}
    </div>
  )
}

/** Tempo em h:min (aceita 5:20, 5h20, 1,5 ou 90min). Guarda em minutos. */
export function DurationInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & { value: number | null; onValueChange: (v: number | null) => void }) {
  const [text, setText] = useState(() => hhmm(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(hhmm(value))
  }, [value, focused])
  return (
    <div className="relative flex items-center">
      <input
        inputMode="text"
        autoComplete="off"
        placeholder="0:00"
        className={cn(control, 'num h-11 pr-14', className)}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setText(hhmm(value))
        }}
        onChange={(e) => {
          setText(e.target.value)
          onValueChange(parseDuration(e.target.value))
        }}
        {...props}
      />
      <span className="pointer-events-none absolute right-3 text-sm text-fg-muted">h:min</span>
    </div>
  )
}

export function Checkbox({ label, className, ...props }: ComponentProps<'input'> & { label: ReactNode }) {
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 text-[15px]', className)}>
      <input type="checkbox" className="size-5 shrink-0 accent-[var(--accent)]" {...props} />
      <span>{label}</span>
    </label>
  )
}

/** Data sempre em dd/mm/aaaa, com o calendário nativo no botão. Guarda aaaa-mm-dd. */
export function DateInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & { value: string | null; onValueChange: (v: string | null) => void }) {
  const toText = (v: string | null) => (v ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : '')
  const [text, setText] = useState(() => toText(value))
  const [focused, setFocused] = useState(false)
  const pickerId = useId()
  useEffect(() => {
    if (!focused) setText(toText(value))
  }, [value, focused])

  function onType(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, 8)
    const masked = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/')
    setText(masked)
    if (d.length === 8) {
      const iso = `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`
      const dt = new Date(`${iso}T12:00:00Z`)
      onValueChange(!Number.isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === iso ? iso : null)
    } else if (!d.length) onValueChange(null)
  }

  return (
    <div className="relative flex items-center">
      <input
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        className={cn(control, 'num h-11 pr-12', className)}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onType(e.target.value)}
        {...props}
      />
      <label htmlFor={pickerId} className="absolute right-1 flex size-9 cursor-pointer items-center justify-center rounded-ui text-fg-muted hover:bg-surface-2">
        <CalendarBlank className="size-5" aria-hidden />
        <span className="sr-only">Abrir calendário</span>
        <input
          id={pickerId}
          type="date"
          tabIndex={-1}
          className="absolute inset-0 cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-full"
          value={value ?? ''}
          onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
          onChange={(e) => onValueChange(e.target.value || null)}
        />
      </label>
    </div>
  )
}
