import type { Database } from './database.types'

type T = Database['public']['Tables']
export type Row<K extends keyof T> = T[K]['Row']
export type Insert<K extends keyof T> = T[K]['Insert']
export type Update<K extends keyof T> = T[K]['Update']

export type Settings = Row<'settings'>
export type Printer = Row<'printers'>
export type Customer = Row<'customers'>
export type Filament = Row<'filaments'>
export type CatalogItem = Row<'catalog_items'>
export type Quote = Row<'quotes'>
export type QuoteItem = Row<'quote_items'>
export type Order = Row<'orders'>
export type OrderItem = Row<'order_items'>
export type Payment = Row<'payments'>
export type PrintJob = Row<'print_jobs'>
export type Failure = Row<'failures'>
export type OrderEvent = Row<'order_events'>
export type OrderPhoto = Row<'order_photos'>

export type Extra = { label: string; amount: number }
