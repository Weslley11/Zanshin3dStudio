import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Dialog } from '@/components/ui/dialog'
import { errorMessage } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { modelKeys } from './api'
import { uploadModel, type UploadStep } from './upload'

export const ACCEPT = '.stl,.3mf,.obj'

const STEP_LABEL: Record<UploadStep, string> = {
  lendo: 'Lendo o arquivo',
  miniatura: 'Gerando a miniatura',
  enviando: 'Guardando no Supabase',
  pronto: 'Pronto',
}

/** Botão de envio reaproveitado na lista e no estado vazio. */
export function useModelUpload() {
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState<UploadStep | null>(null)
  const [fileName, setFileName] = useState('')

  async function onFile(file?: File) {
    if (!file) return
    setFileName(file.name)
    try {
      const id = await uploadModel(file, setStep)
      qc.invalidateQueries({ queryKey: modelKeys.all })
      toast.success('Modelo guardado')
      navigate(`/modelos/${id}`)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setStep(null)
      if (input.current) input.current.value = ''
    }
  }

  const element = (
    <>
      <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <Dialog open={step != null} onOpenChange={() => {}} title="Enviando modelo" description={fileName}>
        <ol className="flex flex-col gap-3 py-2">
          {(['lendo', 'miniatura', 'enviando'] as UploadStep[]).map((s, i, all) => {
            const cur = step ? all.indexOf(step) : -1
            return (
              <li key={s} className={cn('flex items-center gap-3 text-sm', i > cur ? 'text-fg-subtle' : 'text-fg')}>
                {i === cur ? <CircleNotch className="size-4 animate-spin" /> : <span className={cn('size-2 rounded-full', i < cur ? 'bg-ok' : 'bg-border-strong')} />}
                {STEP_LABEL[s]}
              </li>
            )
          })}
        </ol>
      </Dialog>
    </>
  )
  return { open: () => input.current?.click(), busy: step != null, element }
}
