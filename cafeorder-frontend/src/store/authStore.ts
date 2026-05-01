import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types/index'

interface AuthState {
    token: string | null
    user: AuthUser | null
    isLoading: boolean

    setAuth: (user: AuthUser, token: string) => void
    clearAuth: () => void
    setLoading: (loading: boolean) => void
}

const isTokenValid = (user: AuthUser | null): boolean => {
    if (!user?.accessTokenExpiry) return false
    return new Date(user.accessTokenExpiry) > new Date()
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isLoading: false,

            // persist middleware zaten storage'a yazıyor — manuel localStorage kaldırıldı
            setAuth: (user, token) => {
                set({ user, token, isLoading: false })
            },

            clearAuth: () => {
                set({ user: null, token: null, isLoading: false })
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
            // Sadece token ve user persist ediliyor, isLoading hayır
            partialize: (state) => ({ token: state.token, user: state.user }),
        }
    )
)

export const useAuthState = () => {
    const { user, token } = useAuthStore()
    return {
        user,
        isAuthenticated: !!token && isTokenValid(user),
        role: user?.roles?.[0] ?? null,
        displayName: user?.displayName ?? null,
    }
}