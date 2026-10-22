import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { ListSkeleton } from '@/components/ui/states'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireOwner } from '@/features/auth/RequireOwner'

// cada tela num pedaço separado: a página do cliente e o login carregam rápido
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const HomePage = named(() => import('@/features/home/HomePage'), 'HomePage')
const QuotesPage = named(() => import('@/features/quotes/QuotesPage'), 'QuotesPage')
const QuoteEditorPage = named(() => import('@/features/quotes/QuoteEditorPage'), 'QuoteEditorPage')
const OrdersPage = named(() => import('@/features/orders/OrdersPage'), 'OrdersPage')
const OrderDetailPage = named(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage')
const QueuePage = named(() => import('@/features/queue/QueuePage'), 'QueuePage')
const FilamentsPage = named(() => import('@/features/filaments/FilamentsPage'), 'FilamentsPage')
const CustomersPage = named(() => import('@/features/customers/CustomersPage'), 'CustomersPage')
const CustomerDetailPage = named(() => import('@/features/customers/CustomerDetailPage'), 'CustomerDetailPage')
const CatalogPage = named(() => import('@/features/catalog/CatalogPage'), 'CatalogPage')
const FinancePage = named(() => import('@/features/finance/FinancePage'), 'FinancePage')
const SettingsPage = named(() => import('@/features/settings/SettingsPage'), 'SettingsPage')
const TrackingPage = named(() => import('@/features/tracking/TrackingPage'), 'TrackingPage')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
})

function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <ListSkeleton rows={3} height="h-24" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/acompanhar/:token" element={<TrackingPage />} />
              <Route element={<RequireOwner />}>
                <Route element={<AppShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="orcamentos" element={<QuotesPage />} />
                  <Route path="orcamentos/novo" element={<QuoteEditorPage />} />
                  <Route path="orcamentos/:id" element={<QuoteEditorPage />} />
                  <Route path="pedidos" element={<OrdersPage />} />
                  <Route path="pedidos/:id" element={<OrderDetailPage />} />
                  <Route path="fila" element={<QueuePage />} />
                  <Route path="filamentos" element={<FilamentsPage />} />
                  <Route path="clientes" element={<CustomersPage />} />
                  <Route path="clientes/:id" element={<CustomerDetailPage />} />
                  <Route path="catalogo" element={<CatalogPage />} />
                  <Route path="financeiro" element={<FinancePage />} />
                  <Route path="configuracoes" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!rounded-ui !border-border !bg-surface-2 !text-fg !font-sans',
        }}
      />
    </QueryClientProvider>
  )
}
