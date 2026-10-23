import { brl, date, docNumber } from './format'

/** Mensagens prontas para o cliente, uma por etapa do pedido e duas avulsas. */
export const MESSAGE_KEYS = ['aprovado', 'na_fila', 'imprimindo', 'pos_processamento', 'pronto', 'entregue', 'restante', 'rastreio'] as const
export type MessageKey = (typeof MESSAGE_KEYS)[number]

export const MESSAGE_LABEL: Record<MessageKey, string> = {
  aprovado: 'Pedido confirmado',
  na_fila: 'Entrou na fila',
  imprimindo: 'Começou a imprimir',
  pos_processamento: 'No acabamento',
  pronto: 'Pronto',
  entregue: 'Entregue (agradecimento)',
  restante: 'Cobrar o restante',
  rastreio: 'Código de rastreio',
}

export const DEFAULT_TEMPLATES: Record<MessageKey, string> = {
  aprovado: 'Olá, {cliente}! Pedido {pedido} confirmado. Previsão de entrega: {prazo}. Você acompanha o andamento por aqui: {link}',
  na_fila: 'Olá, {cliente}! O pedido {pedido} entrou na fila de impressão. Acompanhe por aqui: {link}',
  imprimindo: 'Olá, {cliente}! Começamos a imprimir o pedido {pedido}. Acompanhe por aqui: {link}',
  pos_processamento: 'Olá, {cliente}! O pedido {pedido} saiu da impressora e está no acabamento. Acompanhe por aqui: {link}',
  pronto: 'Olá, {cliente}! O pedido {pedido} está pronto. {entrega} {cobranca} Fotos e detalhes: {link}',
  entregue: 'Olá, {cliente}! Obrigado pela compra. Se postar a peça, marque a {instagram}. Qualquer coisa, é só chamar por aqui.',
  restante: 'Olá, {cliente}! Falta o restante de {restante} do pedido {pedido}. Pode ser por Pix, dinheiro ou cartão.',
  rastreio: 'Olá, {cliente}! O pedido {pedido} foi postado nos Correios. Código de rastreio: {rastreio}. Acompanhe por aqui: {link}',
}

/** Marcadores aceitos nos textos (mostrados na tela de edição). */
export const PLACEHOLDERS: { key: string; help: string }[] = [
  { key: 'cliente', help: 'primeiro nome do cliente' },
  { key: 'pedido', help: 'número, ex.: ZAN-0012' },
  { key: 'prazo', help: 'data de entrega ou "a combinar"' },
  { key: 'link', help: 'página de acompanhamento' },
  { key: 'itens', help: 'peças do pedido' },
  { key: 'total', help: 'valor total' },
  { key: 'restante', help: 'quanto falta pagar' },
  { key: 'cobranca', help: 'frase do restante, só se faltar pagar' },
  { key: 'entrega', help: 'frase conforme retirada, motoboy ou Correios' },
  { key: 'rastreio', help: 'código dos Correios' },
  { key: 'instagram', help: '@ do estúdio' },
  { key: 'estudio', help: 'nome do estúdio' },
]

export type MessageOrder = {
  number: number
  public_token: string
  due_date: string | null
  total: number | string | null
  paid_total: number | string
  delivery_method: string | null
  tracking_code: string | null
  customer: { name: string; whatsapp: string | null } | null
  items: { description: string; quantity: number }[]
}

export type MessageSettings = {
  business_name: string
  business_instagram: string | null
  message_templates?: unknown
}

export function templatesFrom(settings: MessageSettings | undefined): Record<MessageKey, string> {
  const custom = (settings?.message_templates ?? {}) as Partial<Record<MessageKey, string>>
  const out = { ...DEFAULT_TEMPLATES }
  for (const k of MESSAGE_KEYS) if (typeof custom[k] === 'string' && custom[k]!.trim()) out[k] = custom[k]!
  return out
}

export function messageVars(order: MessageOrder, settings: MessageSettings | undefined, origin: string): Record<string, string> {
  const remaining = Math.max(0, Number(order.total) - Number(order.paid_total))
  const entrega =
    order.delivery_method === 'retirada'
      ? 'Pode retirar quando quiser, é só me avisar o melhor horário.'
      : order.delivery_method === 'motoboy'
        ? 'Vamos combinar a entrega por motoboy?'
        : order.delivery_method === 'correios'
          ? 'Vamos postar nos Correios e te mando o código de rastreio.'
          : ''
  return {
    cliente: order.customer?.name.trim().split(/\s+/)[0] ?? '',
    pedido: docNumber(order.number),
    prazo: order.due_date ? date(order.due_date) : 'a combinar',
    link: `${origin}/acompanhar/${order.public_token}`,
    itens: order.items.map((i) => (i.quantity > 1 ? `${i.quantity}x ${i.description}` : i.description)).join(', '),
    total: brl(Number(order.total)),
    restante: brl(remaining),
    cobranca: remaining > 0.009 ? `Falta o restante de ${brl(remaining)}.` : '',
    entrega,
    rastreio: order.tracking_code ?? '',
    instagram: settings?.business_instagram ? `@${settings.business_instagram}` : settings?.business_name ?? '',
    estudio: settings?.business_name ?? '',
  }
}

/** Troca os {marcadores} e arruma espaços que sobram quando uma frase vem vazia. */
export function renderTemplate(template: string, vars: Record<string, string>) {
  return template
    .replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m))
    .replace(/^(Olá), !/, '$1!') // cliente sem nome
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.,!?])/g, '$1')
    .trim()
}

/** Mensagem da etapa (os status sem texto, como cancelado, não têm). */
export function messageKeyForStatus(status: string): MessageKey | null {
  return (MESSAGE_KEYS as readonly string[]).includes(status) && !['restante', 'rastreio'].includes(status) ? (status as MessageKey) : null
}
