import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage, supabase } from './supabase'
import type { Customer, Filament, Printer, Settings } from './types'

/** Lança o erro do Supabase para o React Query tratar. */
export function must<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error
  return res.data as T
}

export const keys = {
  settings: ['settings'] as const,
  printers: ['printers'] as const,
  filaments: ['filaments'] as const,
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  catalog: ['catalog'] as const,
  quotes: ['quotes'] as const,
  quote: (id: string) => ['quotes', id] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  jobs: ['print_jobs'] as const,
  failures: ['failures'] as const,
  finance: ['finance'] as const,
}

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: async () => must(await supabase.from('settings').select('*').eq('id', 1).single()) as Settings,
  })
}

export function usePrinters() {
  return useQuery({
    queryKey: keys.printers,
    queryFn: async () => must(await supabase.from('printers').select('*').order('created_at')) as Printer[],
  })
}

export function useFilaments() {
  return useQuery({
    queryKey: keys.filaments,
    queryFn: async () =>
      must(await supabase.from('filaments').select('*').order('archived').order('material').order('brand').order('color_name')) as Filament[],
  })
}

export function useCustomers() {
  return useQuery({
    queryKey: keys.customers,
    queryFn: async () => {
      const [c, s] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('customer_stats').select('*'),
      ])
      const customers = must(c) as Customer[]
      const stats = new Map((must(s) ?? []).map((r) => [r.customer_id, r]))
      return customers.map((cu) => ({
        ...cu,
        orders_count: Number(stats.get(cu.id)?.orders_count ?? 0),
        total_spent: Number(stats.get(cu.id)?.total_spent ?? 0),
        last_order_at: stats.get(cu.id)?.last_order_at ?? null,
      }))
    },
  })
}
export type CustomerWithStats = NonNullable<ReturnType<typeof useCustomers>['data']>[number]

/** Mutação com toast de erro padrão e invalidação das chaves afetadas. */
export function useAction<TVars, TResult = unknown>(
  fn: (vars: TVars) => Promise<TResult>,
  opts: { invalidate?: QueryKey[]; success?: string | ((r: TResult) => string); onSuccess?: (r: TResult, v: TVars) => void } = {},
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => {
      opts.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: k }))
      if (opts.success) toast.success(typeof opts.success === 'function' ? opts.success(r) : opts.success)
      opts.onSuccess?.(r, v)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
}

/** Limite de estoque do carretel: o próprio ou o padrão das configurações. */
export function lowStockLimit(f: Pick<Filament, 'min_stock_g'>, s: Settings | undefined) {
  return f.min_stock_g ?? s?.low_stock_default_g ?? null
}
export function isLowStock(f: Filament, s: Settings | undefined) {
  const lim = lowStockLimit(f, s)
  return !f.archived && lim != null && f.remaining_g < lim
}
