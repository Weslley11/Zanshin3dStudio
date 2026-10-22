import { useQuery } from '@tanstack/react-query'
import { keys, must, useAction } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { OrderStatus } from '@/lib/constants'
import type { Customer, Failure, Order, OrderEvent, OrderItem, OrderPhoto, Payment, PrintJob } from '@/lib/types'

export type OrderListRow = Order & {
  customer: Pick<Customer, 'id' | 'name' | 'whatsapp'> | null
  items: Pick<OrderItem, 'description' | 'quantity'>[]
}

export function useOrders() {
  return useQuery({
    queryKey: keys.orders,
    queryFn: async () =>
      must(
        await supabase
          .from('orders')
          .select('*, customer:customers(id, name, whatsapp), items:order_items(description, quantity)')
          .order('created_at', { ascending: false }),
      ) as unknown as OrderListRow[],
  })
}

export type OrderDetail = Order & {
  customer: Customer | null
  items: OrderItem[]
  payments: Payment[]
  photos: OrderPhoto[]
  events: OrderEvent[]
  jobs: PrintJob[]
  failures: Failure[]
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: keys.order(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const o = must(
        await supabase
          .from('orders')
          .select('*, customer:customers(*), items:order_items(*), payments(*), photos:order_photos(*), events:order_events(*), jobs:print_jobs(*), failures(*)')
          .eq('id', id!)
          .single(),
      ) as unknown as OrderDetail
      o.items.sort((a, b) => a.position - b.position)
      o.payments.sort((a, b) => a.paid_at.localeCompare(b.paid_at))
      o.photos.sort((a, b) => a.created_at.localeCompare(b.created_at))
      o.events.sort((a, b) => a.created_at.localeCompare(b.created_at))
      o.jobs.sort((a, b) => a.position - b.position)
      o.failures.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
      return o
    },
  })
}

/** Mudar status (o banco registra o histórico e cria as placas ao entrar na fila). */
export function useSetOrderStatus() {
  return useAction(
    async ({ id, status }: { id: string; status: OrderStatus }) => must(await supabase.from('orders').update({ status }).eq('id', id)),
    { invalidate: [keys.orders, keys.jobs, ['customers']] },
  )
}
