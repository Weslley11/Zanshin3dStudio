import { useQuery } from '@tanstack/react-query'
import { keys, must } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Customer, Quote, QuoteItem } from '@/lib/types'

export type QuoteWithItems = Quote & { items: QuoteItem[]; customer: Customer | null; order: { id: string } | null }

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: keys.quote(id ?? 'novo'),
    enabled: Boolean(id),
    queryFn: async () => {
      const q = must(
        await supabase.from('quotes').select('*, items:quote_items(*), customer:customers(*), order:orders(id)').eq('id', id!).single(),
      ) as unknown as Omit<QuoteWithItems, 'order'> & { order: { id: string }[] | { id: string } | null }
      const order = Array.isArray(q.order) ? (q.order[0] ?? null) : q.order
      return { ...q, order, items: [...q.items].sort((a, b) => a.position - b.position) } as QuoteWithItems
    },
  })
}

export function useQuotes() {
  return useQuery({
    queryKey: keys.quotes,
    queryFn: async () =>
      must(
        await supabase
          .from('quotes')
          .select('id, number, status, total, valid_until, created_at, client_viewed_at, approved_via, customer:customers(id, name), items:quote_items(description)')
          .order('number', { ascending: false }),
      ),
  })
}
