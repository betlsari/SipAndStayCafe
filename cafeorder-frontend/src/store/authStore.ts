// cafeorder-frontend/src/store/authStore.ts
import { create } from 'zustand';
import type { AuthUser } from '../api/auth.api';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    // Artık doğrudan AuthUser kullanıyoruz
    user: AuthUser | null;
    isLoading: boolean;
    setAuth: (user: AuthUser, token: string) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
}

const isTokenValid = (user: AuthUser | null): boolean => {
    if (!user?.accessTokenExpiry) return false;
    return new Date(user.accessTokenExpiry) > new Date();
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    refreshToken: null,
    user: null,
    isLoading: false,
    setAuth: (user, token) =>
        set({
            user,
            token,
            refreshToken: user.refreshToken || null,
            isLoading: false,
        }),
    clearAuth: () => set({ user: null, token: null, refreshToken: null, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
}));

// State'e erişim için yardımcı hook
export const useAuthState = () => {
    const { user, token } = useAuthStore();
    return {
        user,
        isAuthenticated: !!token && isTokenValid(user),
        role: user?.roles?.[0] || null,
        // username yerine displayName döndürüyoruz
        displayName: user?.displayName || null
    };
};