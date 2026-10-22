export const ORDER_STATUSES = [
  'aprovado',
  'na_fila',
  'imprimindo',
  'pos_processamento',
  'pronto',
  'entregue',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number] | 'cancelado'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aprovado: 'Aprovado',
  na_fila: 'Na fila',
  imprimindo: 'Imprimindo',
  pos_processamento: 'Pós-processamento',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

/** Texto que o cliente vê na página de acompanhamento */
export const ORDER_STATUS_PUBLIC: Record<OrderStatus, string> = {
  aprovado: 'Pedido confirmado',
  na_fila: 'Na fila de impressão',
  imprimindo: 'Imprimindo',
  pos_processamento: 'Acabamento',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUSES.indexOf(s as (typeof ORDER_STATUSES)[number])
  if (i < 0 || i === ORDER_STATUSES.length - 1) return null
  return ORDER_STATUSES[i + 1]
}

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
}

export const MATERIALS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU'] as const

export const ORIGINS: Record<string, string> = {
  site: 'Site',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  feira: 'Feira',
  outro: 'Outro',
}

export const CATEGORIES: Record<string, string> = {
  colecionaveis: 'Colecionáveis e cultura pop',
  tecnicas: 'Peças técnicas e funcionais',
  utilidades: 'Utilidades e acessórios',
  personalizadas: 'Encomendas personalizadas',
}

export const DELIVERY: Record<string, string> = {
  retirada: 'Retirada',
  motoboy: 'Motoboy',
  correios: 'Correios',
}

export const PAYMENT: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
}

export const PAYMENT_KIND: Record<string, string> = {
  sinal: 'Sinal',
  restante: 'Restante',
  outro: 'Outro',
}

export const TIMEZONE = 'America/Sao_Paulo'
