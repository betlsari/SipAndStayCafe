import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Kullanýcý tipini tanýmlýyoruz
export interface User {
    id: string;
    name: string;
    role: string;
}

// 2. Store'un sahip olacaðý tüm alanlarý ve fonksiyonlarý burada belirtiyoruz
interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    // Fonksiyonlar
    login: (userData: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
}

// 3. Store oluþturma
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            // Login fonksiyonu: Hem kullanýcýyý hem tokenlarý set eder
            login: (userData, accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                set({
                    user: userData,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true
                });
            },

            // Logout fonksiyonu: Her þeyi temizler
            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false
                });
            },

            // Sadece tokenlarý güncellemek için (Refresh token senaryosu için)
            setTokens: (accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                set({ accessToken, refreshToken });
            },
        }),
        {
            name: 'auth-storage', // Tarayýcý hafýzasýndaki (localStorage) anahtar adý
        }
    )
);