import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    username: string | null
    role: string | null
    isAuthenticated: boolean

    setTokens: (accessToken: string, refreshToken: string) => void
    setUser: (username: string, role: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            username: null,
            role: null,
            isAuthenticated: false,

            setTokens: (accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken)
                localStorage.setItem('refreshToken', refreshToken)
                set({ accessToken, refreshToken, isAuthenticated: true })
            },

            setUser: (username, role) => set({ username, role }),

            logout: () => {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                set({
                    accessToken: null,
                    refreshToken: null,
                    username: null,
                    role: null,
                    isAuthenticated: false,
                })
            },
        }),
        {
            name: 'cafe-auth',
            partialize: (state) => ({
                username: state.username,
                role: state.role,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)