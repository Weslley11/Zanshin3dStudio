import { describe, expect, it } from 'vitest'
import { DEFAULT_TEMPLATES, messageKeyForStatus, messageVars, renderTemplate, templatesFrom, type MessageOrder } from './messages'

const order: MessageOrder = {
  number: 12,
  public_token: 'abc123',
  due_date: '2026-10-30',
  total: 168.8,
  paid_total: 84.4,
  delivery_method: 'retirada',
  tracking_code: null,
  customer: { name: 'Ana Souza', whatsapp: '5547999990001' },
  items: [{ description: 'Dragão', quantity: 2 }],
}
const settings = { business_name: 'Zanshin 3D Studio', business_instagram: 'zanshin_3dstudio' }

describe('mensagens', () => {
  it('preenche os marcadores', () => {
    const v = messageVars(order, settings, 'https://app.exemplo')
    expect(renderTemplate(DEFAULT_TEMPLATES.aprovado, v)).toBe(
      'Olá, Ana! Pedido ZAN-0012 confirmado. Previsão de entrega: 30/10/2026. Você acompanha o andamento por aqui: https://app.exemplo/acompanhar/abc123',
    )
  })
  it('pronto: frase da entrega e cobrança só quando falta pagar', () => {
    const v = messageVars(order, settings, 'https://app.exemplo')
    expect(renderTemplate(DEFAULT_TEMPLATES.pronto, v)).toContain('Pode retirar quando quiser')
    expect(renderTemplate(DEFAULT_TEMPLATES.pronto, v)).toContain('Falta o restante de R$ 84,40.')
    const pago = messageVars({ ...order, paid_total: 168.8, delivery_method: null }, settings, 'https://app.exemplo')
    const txt = renderTemplate(DEFAULT_TEMPLATES.pronto, pago)
    expect(txt).not.toContain('Falta')
    expect(txt).not.toMatch(/ {2}| \./)
    expect(txt).toBe('Olá, Ana! O pedido ZAN-0012 está pronto. Fotos e detalhes: https://app.exemplo/acompanhar/abc123')
  })
  it('sem nome do cliente, sem prazo', () => {
    const v = messageVars({ ...order, customer: null, due_date: null }, settings, 'x')
    expect(renderTemplate(DEFAULT_TEMPLATES.aprovado, v)).toMatch(/^Olá! Pedido ZAN-0012 confirmado. Previsão de entrega: a combinar\./)
  })
  it('marcador desconhecido fica como está', () => {
    expect(renderTemplate('Oi {nada}', {})).toBe('Oi {nada}')
  })
  it('texto editado substitui o padrão; vazio volta ao padrão', () => {
    const t = templatesFrom({ ...settings, message_templates: { aprovado: 'Fechado, {cliente}!', na_fila: '  ' } })
    expect(t.aprovado).toBe('Fechado, {cliente}!')
    expect(t.na_fila).toBe(DEFAULT_TEMPLATES.na_fila)
  })
  it('mensagem por status', () => {
    expect(messageKeyForStatus('pronto')).toBe('pronto')
    expect(messageKeyForStatus('cancelado')).toBeNull()
  })
})
