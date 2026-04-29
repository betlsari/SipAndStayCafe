import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Kullanýcý tipini tanýmlýyoruz
export interface User {
    id: string;
    name: string;
    role: string;
}

// 2. Store yapýsýný tanýmlýyoruz
interface AuthState {
    user: User | null;
    token: string | null; // axiosInstance 'token' beklediði için isimlendirmeyi sadeleþtirdik
    refreshToken: string | null;
    isAuthenticated: boolean;
    // Fonksiyonlar
    setAuth: (user: User, token: string, refreshToken?: string) => void;
    setTokens: (token: string, refreshToken?: string) => void;
    clearAuth: () => void;
}

// 3. Store oluþturma
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,

            // Hem kullanýcýyý hem tokenlarý tek seferde set eder (Giriþ anýnda)
            setAuth: (user, token, refreshToken) => {
                set({
                    user,
                    token,
                    refreshToken: refreshToken || null,
                    isAuthenticated: true,
                });
            },

            // Sadece tokenlarý güncellemek için (Refresh token senaryosu için)
            setTokens: (token, refreshToken) => {
                set((state) => ({
                    token,
                    refreshToken: refreshToken ?? state.refreshToken,
                }));
            },

            // Her þeyi temizler (Çýkýþ anýnda)
            clearAuth: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
                // Not: Persist middleware olduðu için localStorage.removeItem yapmanýza gerek yoktur, 
                // Zustand otomatik temizler.
            },
        }),
        {
            name: 'auth-storage', // Tarayýcý hafýzasýndaki (localStorage) anahtar adý
            storage: createJSONStorage(() => localStorage),
            // Sadece belirli alanlarý kaydetmek isterseniz 'partialize' ekleyebilirsiniz
        }
    )
);