import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Suspense, lazy } from 'react'

import { ProtectedRoute } from './components/ui/ProtectedRoute'
import SessionDetailPage from './pages/cashier/SessionDetailPage'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import Payment from './components/customer/Payment'
// Ekle
import AdminLayout from './pages/admin/AdminLayout'
import CategoryManagement from './pages/admin/CategoryManagement'



import ErrorBoundary from './components/ui/ErrorBoundary'
import { useRegisterSW } from './hooks/useRegisterSW'

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
// ─── Lazy pages ───────────────────────────────────────────────────────────────
const Login = lazy(() => import('./pages/auth/Login'))

// Customer (anonymous)
const Menu = lazy(() => import('./pages/customer/Menu'))

const OrderStatus = lazy(() => import('./pages/customer/OrderStatus'))
const PaymentResult = lazy(() => import('./pages/customer/PaymentResult'))
const ItemManagement = lazy(() => import('./pages/admin/ItemManagement'))


const TableManagement = lazy(() => import('./pages/admin/TableManagement'))

// Kitchen (KitchenStaff)
const KitchenDisplay = lazy(() => import('./pages/kitchen/KitchenDisplay'))

// Cashier (Cashier | Owner)
const CashierPage = lazy(() => import('./pages/cashier/CashierPage'))

const ReportPage = lazy(() => import('./pages/admin/ReportPage'))


// ─── React Query client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
        },
    },
})

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
    useRegisterSW()
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/menu" element={<Menu />} />
                        <Route path="/order-status" element={<OrderStatus />} />
                        <Route path="/payment" element={<Payment />} />
                        <Route path="/payment-result" element={<PaymentResult />} />
                        <Route
                            path="/kitchen"
                            element={
                                <ProtectedRoute roles={['KitchenStaff']}>
                                    <ErrorBoundary>
                                        <KitchenDisplay />
                                    </ErrorBoundary>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/cashier/sessions/:id"
                            element={
                                <ErrorBoundary>
                                    <SessionDetailPage />
                                </ErrorBoundary>
                            }
                        />

                        <Route
                            path="/cashier"
                            element={
                                <ProtectedRoute roles={['Cashier', 'Owner']}>
                                    <ErrorBoundary>
                                        <CashierPage />
                                    </ErrorBoundary>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute roles={['Owner']}>
                                    <ErrorBoundary>
                                        <AdminLayout />
                                    </ErrorBoundary>
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<AdminDashboard />} />
                            <Route path="categories" element={<CategoryManagement />} />
                            <Route path="items" element={<ItemManagement />} />
                            <Route path="tables" element={<TableManagement />} />
                            <Route path="reports" element={<ReportPage />} />
                        </Route>

                      


                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Suspense>

                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1a1a1a',
                            color: '#f5f5f5',
                            borderRadius: '8px',
                            border: '1px solid #333',
                            fontSize: '14px',
                        },
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    )
}