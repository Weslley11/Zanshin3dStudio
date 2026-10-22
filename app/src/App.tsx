import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireOwner } from '@/features/auth/RequireOwner'
import { CustomerDetailPage } from '@/features/customers/CustomerDetailPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { FilamentsPage } from '@/features/filaments/FilamentsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { QuoteEditorPage } from '@/features/quotes/QuoteEditorPage'
import { QuotesPage } from '@/features/quotes/QuotesPage'
import { OrderDetailPage } from '@/features/orders/OrderDetailPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { QueuePage } from '@/features/queue/QueuePage'
import { HomePage } from '@/features/home/HomePage'
import { FinancePage } from '@/features/finance/FinancePage'
import { CatalogPage } from '@/features/catalog/CatalogPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
