import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Sayfalar
import Login from './pages/auth/Login';
import OwnerDashboard from './pages/admin/Dashboard';
import CashierPanel from './pages/cashier/Orders';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import CustomerMenu from './pages/customer/Menu';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* --- ANONÝM ROTALAR --- */}
                <Route path="/login" element={<Login />} />

                {/* Müþteri Rotasý: Herkese açýk, QR koddan gelen tableId parametresi ile */}
                <Route path="/table/:tableId" element={<CustomerMenu />} />

                {/* --- KORUMALI ROTALAR --- */}

                {/* Sadece Owner (Yönetici) */}
                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['Owner']}>
                        <OwnerDashboard />
                    </ProtectedRoute>
                } />

                {/* Kasiyer (Owner da girebilir) */}
                <Route path="/cashier/*" element={
                    <ProtectedRoute allowedRoles={['Cashier', 'Owner']}>
                        <CashierPanel />
                    </ProtectedRoute>
                } />

                {/* Mutfak Ekibi (Owner da girebilir) */}
                <Route path="/kitchen/*" element={
                    <ProtectedRoute allowedRoles={['KitchenStaff', 'Owner']}>
                        <KitchenDisplay />
                    </ProtectedRoute>
                } />

                {/* Hatalý Yollar Ýçin Yönlendirmeler */}
                <Route path="/unauthorized" element={<div>Yetkiniz yok!</div>} />
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;