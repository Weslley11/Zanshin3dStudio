import { describe, expect, it } from 'vitest'
import { toCsv } from './backup'

describe('toCsv', () => {
  it('formato do Excel em português', () => {
    const csv = toCsv([
      { nome: 'Ana; Souza', total: 168.8, pago: '84.40', ativo: true, extras: [{ label: 'Ímã' }], obs: null },
      { nome: 'Bruno "B"', total: 10, novo: 'x' },
    ])
    const [head, l1, l2] = csv.replace('﻿', '').split('\r\n')
    expect(head).toBe('nome;total;pago;ativo;extras;obs;novo')
    expect(l1).toBe('"Ana; Souza";168,8;84,40;sim;"[{""label"":""Ímã""}]";;')
    expect(l2).toBe('"Bruno ""B""";10;;;;;x')
  })
  it('tabela vazia', () => {
    expect(toCsv([])).toBe('﻿')
  })
})
