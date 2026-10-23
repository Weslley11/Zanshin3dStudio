import { strToU8, zipSync } from 'fflate'
import { supabase } from './supabase'

/** Tabelas do backup e o nome da planilha de cada uma. */
export const BACKUP_TABLES = [
  ['settings', 'configuracoes'],
  ['printers', 'impressoras'],
  ['customers', 'clientes'],
  ['filaments', 'filamentos'],
  ['catalog_items', 'catalogo'],
  ['quotes', 'orcamentos'],
  ['quote_items', 'orcamentos_itens'],
  ['orders', 'pedidos'],
  ['order_items', 'pedidos_itens'],
  ['payments', 'pagamentos'],
  ['order_photos', 'pedidos_fotos'],
  ['order_events', 'pedidos_historico'],
  ['print_jobs', 'fila_placas'],
  ['failures', 'falhas'],
  ['models', 'modelos_3d'],
  ['site_requests', 'pedidos_do_site'],
] as const

type Row = Record<string, unknown>

/** Lê a tabela inteira, de mil em mil linhas (limite por consulta do Supabase). */
async function fetchAll(table: string): Promise<Row[] | null> {
  const rows: Row[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table as 'customers')
      .select('*')
      .range(from, from + 999)
    if (error) {
      // tabela de uma atualização que ainda não foi aplicada no banco
      if (error.code === '42P01' || error.code === 'PGRST205') return null
      throw error
    }
    rows.push(...(data as Row[]))
    if (!data || data.length < 1000) return rows
  }
}

const NUMERIC = /^-?\d+(\.\d+)?$/

/** CSV para Excel em português: ponto e vírgula, vírgula decimal e BOM. */
export function toCsv(rows: Row[]) {
  if (!rows.length) return '﻿'
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))]
  const cell = (v: unknown) => {
    if (v == null) return ''
    if (typeof v === 'number') return String(v).replace('.', ',')
    if (typeof v === 'boolean') return v ? 'sim' : 'não'
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    if (NUMERIC.test(s)) return s.replace('.', ',')
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => cell(r[c])).join(';'))].join('\r\n')
}

export type BackupResult = { file: File; counts: Record<string, number>; missing: string[] }

export async function buildBackup(onProgress?: (done: number, total: number) => void): Promise<BackupResult> {
  const tables: Record<string, Row[]> = {}
  const counts: Record<string, number> = {}
  const missing: string[] = []
  let done = 0
  for (const [table] of BACKUP_TABLES) {
    const rows = await fetchAll(table)
    if (rows) {
      tables[table] = rows
      counts[table] = rows.length
    } else missing.push(table)
    onProgress?.(++done, BACKUP_TABLES.length)
  }
  const now = new Date()
  const stamp = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const files: Record<string, Uint8Array> = {
    'backup.json': strToU8(JSON.stringify({ app: 'zanshin-gestao', version: 1, exported_at: now.toISOString(), tables }, null, 1)),
    'LEIA-ME.txt': strToU8(
      [
        'Backup do app de gestão da Zanshin 3D Studio',
        `Gerado em ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        '',
        'backup.json   cópia completa dos dados (é o arquivo usado para restaurar)',
        'planilhas/    uma planilha por tabela, para abrir no Excel ou no Google Planilhas',
        '',
        'Fotos e arquivos 3D continuam guardados no Supabase; o backup leva o caminho de cada um.',
        'Guarde este arquivo num lugar seguro, como o Google Drive.',
      ].join('\r\n'),
    ),
  }
  for (const [table, sheet] of BACKUP_TABLES) {
    if (tables[table]) files[`planilhas/${sheet}.csv`] = strToU8(toCsv(tables[table]))
  }
  const zip = zipSync(files, { level: 6 })
  const file = new File([zip as BlobPart], `zanshin-backup-${stamp}.zip`, { type: 'application/zip' })
  return { file, counts, missing }
}
