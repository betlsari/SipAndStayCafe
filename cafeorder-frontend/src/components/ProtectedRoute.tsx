import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import React from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode; // JSX.Element yerine React.ReactNode kullanmak daha güvenlidir
    allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isAuthenticated } = useAuthStore();
    const location = useLocation();

    // 1. Giriþ kontrolü: Giriþ yapmamýþsa login sayfasýna yönlendir
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Rol kontrolü: Kullanýcýnýn rolü izin verilen listede yoksa yetkisiz sayfasýna gönder
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;