import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types/index'

interface AuthState {
    token: string | null
    refreshToken: string | null
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
            refreshToken: null,
            user: null,
            isLoading: false,

            // ✅ FIXED setAuth
            setAuth: (user, token) => {
                localStorage.setItem('token', token)
                localStorage.setItem('refreshToken', user.refreshToken || '')

                set({
                    user,
                    token,
                    refreshToken: user.refreshToken || null,
                    isLoading: false,
                })
            },

            // ✅ logout
            clearAuth: () => {
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')

                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isLoading: false,
                })
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
        }
    )
)

// 🔥 derived state hook
export const useAuthState = () => {
    const { user, token } = useAuthStore()

    return {
        user,
        isAuthenticated: !!token && isTokenValid(user),
        role: user?.roles?.[0] || null,
        displayName: user?.displayName || null,
    }
}