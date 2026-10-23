import { useState } from 'react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Field, Select, Textarea } from '@/components/ui/field'
import { DEFAULT_TEMPLATES, MESSAGE_KEYS, MESSAGE_LABEL, PLACEHOLDERS, messageVars, renderTemplate, templatesFrom, type MessageKey } from '@/lib/messages'
import { keys, must, useAction } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Settings } from '@/lib/types'

// pedido de exemplo só para a prévia
const SAMPLE = {
  number: 12,
  public_token: 'exemplo',
  due_date: '2026-10-30',
  total: 168.8,
  paid_total: 84.4,
  delivery_method: 'retirada',
  tracking_code: 'AA123456789BR',
  customer: { name: 'Ana Souza', whatsapp: null },
  items: [{ description: 'Dragão articulado', quantity: 1 }],
}

export function MessagesSection({ settings }: { settings: Settings }) {
  const saved = templatesFrom(settings)
  const [key, setKey] = useState<MessageKey>('pronto')
  const [drafts, setDrafts] = useState<Record<MessageKey, string>>(saved)
  const text = drafts[key]
  const changed = MESSAGE_KEYS.some((k) => drafts[k] !== saved[k])

  const save = useAction(
    async () => {
      // guarda só o que difere do padrão: melhorias futuras no texto padrão continuam chegando
      const custom = Object.fromEntries(MESSAGE_KEYS.filter((k) => drafts[k].trim() && drafts[k] !== DEFAULT_TEMPLATES[k]).map((k) => [k, drafts[k]]))
      return must(await supabase.from('settings').update({ message_templates: custom }).eq('id', 1))
    },
    { invalidate: [keys.settings], success: 'Mensagens salvas' },
  )

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-semibold">Mensagens para o cliente</h2>
      <p className="mt-1 text-sm text-fg-muted">Textos que abrem no WhatsApp em cada etapa do pedido. O que está entre chaves é trocado pelos dados do pedido.</p>
      <div className="mt-5 flex flex-col gap-4">
        <Field label="Mensagem">
          {(p) => (
            <Select {...p} value={key} onChange={(e) => setKey(e.target.value as MessageKey)}>
              {MESSAGE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {MESSAGE_LABEL[k]}
                  {drafts[k] !== DEFAULT_TEMPLATES[k] ? ' (editada)' : ''}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Texto">
          {(p) => <Textarea {...p} rows={5} value={text} onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))} />}
        </Field>
        <div className="rounded-ui bg-surface-2 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-fg-subtle">Como chega para o cliente (pedido de exemplo)</p>
          <p className="whitespace-pre-line">{renderTemplate(text, messageVars(SAMPLE, settings, window.location.origin))}</p>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-fg-muted">Marcadores que dá para usar</summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {PLACEHOLDERS.map((p) => (
              <li key={p.key} className="text-fg-muted">
                <code className="text-fg">{`{${p.key}}`}</code> {p.help}
              </li>
            ))}
          </ul>
        </details>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => save.mutate(undefined)} loading={save.isPending} disabled={!changed}>
            Salvar mensagens
          </Button>
          {text !== DEFAULT_TEMPLATES[key] && (
            <Button variant="ghost" onClick={() => setDrafts((d) => ({ ...d, [key]: DEFAULT_TEMPLATES[key] }))}>
              <ArrowCounterClockwise /> Voltar ao texto padrão
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
