import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CloudArrowDown } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { buildBackup } from '@/lib/backup'
import { shareOrDownload } from '@/lib/download'
import { dateTime, number } from '@/lib/format'
import { keys } from '@/lib/queries'
import { errorMessage, supabase } from '@/lib/supabase'
import type { Settings } from '@/lib/types'

export function BackupSection({ settings }: { settings: Settings }) {
  const qc = useQueryClient()
  const [progress, setProgress] = useState<string | null>(null)
  const last = settings.last_backup_at
  const ref = useRef<HTMLDivElement>(null)
  const { hash } = useLocation()
  // veio do lembrete do Início: rola até aqui
  useEffect(() => {
    if (hash === '#backup') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  async function run() {
    try {
      setProgress('Lendo os dados')
      const { file, counts, missing } = await buildBackup((done, total) => setProgress(`Lendo os dados (${done} de ${total})`))
      setProgress('Salvando o arquivo')
      const how = await shareOrDownload(file)
      if (how === 'cancelled') return
      // registra a data; se a atualização do banco ainda não foi aplicada, só não lembra
      await supabase.from('settings').update({ last_backup_at: new Date().toISOString() }).eq('id', 1)
      qc.invalidateQueries({ queryKey: keys.settings })
      const total = Object.values(counts).reduce((s, n) => s + n, 0)
      toast.success('Backup pronto', {
        description: `${number(total)} registros em ${file.name}${missing.length ? `. Ficaram de fora tabelas que o banco ainda não tem: ${missing.join(', ')}` : ''}`,
      })
    } catch (e) {
      toast.error(`Não deu para gerar o backup: ${errorMessage(e)}`)
    } finally {
      setProgress(null)
    }
  }

  return (
    <Card ref={ref} id="backup" className="scroll-mt-20 p-4 sm:p-6">
      <h2 className="text-base font-semibold">Backup</h2>
      <p className="mt-1 text-sm text-fg-muted">
        O Supabase gratuito não guarda cópias automáticas. Baixe um backup de vez em quando e guarde no Google Drive: vem um arquivo com todos os dados e uma
        planilha por tabela para abrir no Excel.
      </p>
      <p className="mt-3 text-sm">
        Último backup: <span className="num font-medium">{last ? dateTime(last) : 'nenhum ainda'}</span>
      </p>
      <Button className="mt-4" variant="primary" onClick={run} loading={progress != null}>
        <CloudArrowDown /> {progress ?? 'Baixar backup'}
      </Button>
      <p className="mt-3 text-xs text-fg-subtle">Fotos e arquivos 3D continuam no Supabase; o backup leva o caminho de cada um.</p>
    </Card>
  )
}
