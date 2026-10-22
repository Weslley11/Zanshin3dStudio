import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { ORIGINS } from '@/lib/constants'
import { cleanInstagram, formatPhone, normalizePhone } from '@/lib/format'
import { keys, must, useAction } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/lib/types'

export function CustomerDialog({
  customer,
  initialName,
  onClose,
  onSaved,
}: {
  customer?: Customer
  initialName?: string
  onClose: () => void
  onSaved?: (c: Customer) => void
}) {
  const [name, setName] = useState(customer?.name ?? initialName ?? '')
  const [whatsapp, setWhatsapp] = useState(formatPhone(customer?.whatsapp))
  const [instagram, setInstagram] = useState(customer?.instagram ?? '')
  const [city, setCity] = useState(customer?.city ?? '')
  const [origin, setOrigin] = useState(customer?.origin ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const save = useAction(
    async () => {
      const row = {
        name: name.trim(),
        whatsapp: normalizePhone(whatsapp),
        instagram: cleanInstagram(instagram),
        city: city.trim() || null,
        origin: origin || null,
        notes: notes.trim() || null,
      }
      const q = customer
        ? supabase.from('customers').update(row).eq('id', customer.id).select().single()
        : supabase.from('customers').insert(row).select().single()
      return must(await q) as Customer
    },
    { invalidate: [keys.customers], success: 'Cliente salvo', onSuccess: (c) => (onSaved?.(c), onClose()) },
  )

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={customer ? 'Editar cliente' : 'Novo cliente'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="customer-form" loading={save.isPending}>
            Salvar cliente
          </Button>
        </>
      }
    >
      <form
        id="customer-form"
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!name.trim()) return setError('Informe o nome.')
          const digits = whatsapp.replace(/\D/g, '')
          if (digits && digits.length < 10) return setError('WhatsApp incompleto: use DDD + número.')
          setError(null)
          save.mutate(undefined)
        }}
      >
        <Field label="Nome" className="sm:col-span-2">
          {(p) => <Input {...p} required autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="WhatsApp" hint="Com DDD. Ex.: (47) 99999-0000" optional>
          {(p) => <Input {...p} inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} onBlur={() => setWhatsapp(formatPhone(normalizePhone(whatsapp)))} />}
        </Field>
        <Field label="Instagram" hint="Sem o @." optional>
          {(p) => <Input {...p} autoCapitalize="none" value={instagram} onChange={(e) => setInstagram(e.target.value)} />}
        </Field>
        <Field label="Cidade" optional>
          {(p) => <Input {...p} value={city} onChange={(e) => setCity(e.target.value)} />}
        </Field>
        <Field label="Como chegou" optional>
          {(p) => (
            <Select {...p} value={origin} onChange={(e) => setOrigin(e.target.value)}>
              <option value="">Não informado</option>
              {Object.entries(ORIGINS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Observações" optional className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  )
}
