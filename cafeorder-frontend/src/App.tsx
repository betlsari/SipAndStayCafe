import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Suspense, lazy } from 'react';
import './index.css';

// Components
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Hooks
import { useRegisterSW } from './hooks/useRegisterSW';

// Lazy Pages — Auth
const Login = lazy(() => import('./pages/auth/Login'));

// Lazy Pages — Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const ItemManagement = lazy(() => import('./pages/admin/ItemManagement'));
const TableManagement = lazy(() => import('./pages/admin/TableManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ReportPage = lazy(() => import('./pages/admin/ReportPage'));

// Lazy Pages — Kitchen
const KitchenDisplay = lazy(() => import('./pages/kitchen/KitchenDisplay'));

// Lazy Pages — Cashier
const CashierPage = lazy(() => import('./pages/cashier/CashierPage'));
const SessionDetailPage = lazy(() => import('./pages/cashier/SessionDetailPage'));

// Lazy Pages — Customer
const Menu = lazy(() => import('./pages/customer/Menu'));
const OrderStatus = lazy(() => import('./pages/customer/OrderStatus'));
const Payment = lazy(() => import('./pages/customer/Payment'));
const PaymentResult = lazy(() => import('./pages/customer/PaymentResult'));
const WelcomeSplash = lazy(() => import('./pages/customer/WelcomeSplash'));
const TableGuard = lazy(() => import('./components/customer/TableGuard'));

// React Query client configuration
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
        },
    },
});

export default function App() {
    useRegisterSW();

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />

                        <Route
                            path="/welcome"
                            element={
                                <TableGuard>
                                    <WelcomeSplash />
                                </TableGuard>
                            }
                        />
                        <Route
                            path="/menu"
                            element={
                                <TableGuard>
                                    <Menu />
                                </TableGuard>
                            }
                        />
                        <Route path="/order-status" element={<OrderStatus />} />
                        <Route path="/payment" element={<Payment />} />
                        <Route path="/payment-result" element={<PaymentResult />} />

                        {/* Kitchen Routes (Protected: KitchenStaff) */}
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

                        {/* Cashier Routes (Protected: Cashier or Owner) */}
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
                            path="/cashier/sessions/:id"
                            element={
                                <ProtectedRoute roles={['Cashier', 'Owner']}>
                                    <ErrorBoundary>
                                        <SessionDetailPage />
                                    </ErrorBoundary>
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin Routes (Protected: Owner Only) */}
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
                            <Route path="users" element={<UserManagement />} />
                        </Route>

                        {/* Default Redirects */}
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
    );
}