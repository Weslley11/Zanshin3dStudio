import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { DurationInput, Field, Input, NumberInput, Select } from '@/components/ui/field'
import { FilamentSelect } from '@/features/filaments/FilamentSelect'
import { docNumber } from '@/lib/format'
import { keys, must, useAction, useFilaments, usePrinters, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { PrintJob } from '@/lib/types'

/** Criar ou editar uma placa da fila. */
export function JobDialog({
  job,
  orderId,
  orders,
  onClose,
}: {
  job?: PrintJob
  orderId?: string | null
  orders?: { id: string; number: number; customer: { name: string } | null }[]
  onClose: () => void
}) {
  const filaments = useFilaments().data ?? []
  const printers = usePrinters().data ?? []
  const settings = useSettings().data
  const [title, setTitle] = useState(job?.title ?? '')
  const [order, setOrder] = useState<string | null>(job?.order_id ?? orderId ?? null)
  const [filament, setFilament] = useState<string | null>(job?.filament_id ?? null)
  const [printer, setPrinter] = useState<string | null>(job?.printer_id ?? settings?.default_printer_id ?? printers[0]?.id ?? null)
  const [grams, setGrams] = useState<number | null>(job ? Number(job.grams) : null)
  const [minutes, setMinutes] = useState<number | null>(job?.print_minutes ?? null)
  const [error, setError] = useState<string | null>(null)

  const save = useAction(
    async () => {
      const row = { title: title.trim(), order_id: order, filament_id: filament, printer_id: printer, grams: grams ?? 0, print_minutes: minutes ?? 0 }
      if (job) return must(await supabase.from('print_jobs').update(row).eq('id', job.id))
      return must(await supabase.from('print_jobs').insert(row))
    },
    { invalidate: [keys.jobs, keys.orders], success: job ? 'Placa atualizada' : 'Placa adicionada à fila', onSuccess: onClose },
  )

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={job ? 'Editar placa' : 'Nova placa'}
      description="Uma placa é uma impressão: pode ter uma peça ou várias."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="job-form" loading={save.isPending}>
            Salvar placa
          </Button>
        </>
      }
    >
      <form
        id="job-form"
        className="grid grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!title.trim()) return setError('Dê um nome para a placa.')
          if (!minutes) return setError('Informe o tempo estimado.')
          setError(null)
          save.mutate(undefined)
        }}
      >
        <Field label="Nome da placa" className="col-span-2">
          {(p) => <Input {...p} value={title} placeholder="Ex.: Suportes 1 a 4" onChange={(e) => setTitle(e.target.value)} />}
        </Field>
        {orders && (
          <Field label="Pedido" className="col-span-2" optional>
            {(p) => (
              <Select {...p} value={order ?? ''} onChange={(e) => setOrder(e.target.value || null)}>
                <option value="">Sem pedido (estoque, teste)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {docNumber(o.number)} · {o.customer?.name ?? 'Sem cliente'}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Carretel" className="col-span-2" hint="As gramas saem deste carretel quando a placa for concluída.">
          {(p) => <FilamentSelect {...p} filaments={filaments} value={filament} onChange={setFilament} />}
        </Field>
        {printers.length > 1 && (
          <Field label="Impressora" className="col-span-2">
            {(p) => (
              <Select {...p} value={printer ?? ''} onChange={(e) => setPrinter(e.target.value)}>
                {printers.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Gramas">{(p) => <NumberInput {...p} suffix="g" digits={1} value={grams} onValueChange={setGrams} />}</Field>
        <Field label="Tempo">{(p) => <DurationInput {...p} value={minutes} onValueChange={setMinutes} />}</Field>
        {error && (
          <p role="alert" className="col-span-2 text-sm text-danger">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  )
}

/** Placa falhou: registra a perda e devolve a placa ao topo da fila. */
export function FailDialog({ job, onClose }: { job: PrintJob; onClose: () => void }) {
  const [grams, setGrams] = useState<number | null>(null)
  const [minutes, setMinutes] = useState<number | null>(
    job.started_at ? Math.min(job.print_minutes, Math.round((Date.now() - new Date(job.started_at).getTime()) / 60000)) : null,
  )
  const [reason, setReason] = useState('')
  const fail = useAction(
    async () => must(await supabase.rpc('fail_print_job', { p_job_id: job.id, p_grams_lost: grams ?? 0, p_minutes_lost: minutes ?? 0, p_reason: reason })),
    { invalidate: [keys.jobs, keys.filaments, keys.orders, keys.failures], success: 'Falha registrada. A placa voltou para o topo da fila.', onSuccess: onClose },
  )
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Registrar falha"
      description={job.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => fail.mutate(undefined)} loading={fail.isPending}>
            Registrar e reimprimir
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Filamento perdido" hint="Sai do carretel.">
          {(p) => <NumberInput {...p} suffix="g" digits={1} value={grams} onValueChange={setGrams} />}
        </Field>
        <Field label="Tempo perdido">{(p) => <DurationInput {...p} value={minutes} onValueChange={setMinutes} />}</Field>
        <Field label="O que aconteceu" optional className="col-span-2">
          {(p) => <Input {...p} value={reason} placeholder="Ex.: descolou da mesa" onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </div>
    </Dialog>
  )
}
