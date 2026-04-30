// cafeorder-frontend/src/hooks/useAuth.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../api/auth.api';
import type { LoginRequest, RegisterStaffRequest, AuthUser } from '../api/auth.api';
import { useAuthStore, useAuthState } from '../store/authStore';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // username yerine displayName'i alýyoruz
    const { isAuthenticated, role, displayName } = useAuthState();
    const { setAuth, clearAuth } = useAuthStore();

    const login = async (data: LoginRequest) => {
        setLoading(true);
        setError(null);
        try {
            const res = await authApi.login(data);
            const { accessToken, ...userData } = res.data;

            // API'deki AuthUser modeline tam olarak eþleþen nesne oluþturuyoruz
            const authUser: AuthUser = {
                userId: userData.userId,
                displayName: userData.displayName,
                roles: userData.roles,
                refreshToken: userData.refreshToken,
                accessTokenExpiry: userData.accessTokenExpiry
            };

            setAuth(authUser, accessToken);

            // Role tabanlý yönlendirme
            if (authUser.roles.includes('Owner')) navigate('/admin');
            else if (authUser.roles.includes('KitchenStaff')) navigate('/kitchen');
            else if (authUser.roles.includes('Cashier')) navigate('/cashier');
            else navigate('/menu');

        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Giriþ baþarýsýz. Lütfen bilgilerinizi kontrol edin.');
            } else {
                setError('Beklenmedik bir hata oluþtu.');
            }
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterStaffRequest) => {
        setLoading(true);
        setError(null);
        try {
            await authApi.registerStaff(data);
            navigate('/login');
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Personel kaydý baþarýsýz.');
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // Hata olsa bile client-side auth temizlenmeli
        } finally {
            clearAuth();
            navigate('/login');
        }
    };

    return {
        login,
        register,
        logout,
        loading,
        error,
        isAuthenticated,
        role,
        displayName // username yerine bunu dýþarý aktarýyoruz
    };
};