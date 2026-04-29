import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import type { LoginRequest, RegisterRequest } from '../api/auth.api'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { setTokens, setUser, logout: storeLogout, isAuthenticated, role, username } = useAuthStore()
    const navigate = useNavigate()

    const login = async (data: LoginRequest) => {
        setLoading(true)
        setError(null)
        try {
            const res = await authApi.login(data)
            const { accessToken, refreshToken, username, role } = res.data
            setTokens(accessToken, refreshToken)
            setUser(username, role)

            if (role === 'ADMIN') navigate('/admin')
            else if (role === 'WAITER') navigate('/waiter')
            else navigate('/menu')
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Giriþ baþarýsýz. Kullanýcý adý veya þifre hatalý.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const register = async (data: RegisterRequest) => {
        setLoading(true)
        setError(null)
        try {
            await authApi.register(data)
            navigate('/login')
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Kayýt baþarýsýz.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } catch {
            // token zaten geçersiz olabilir, önemli deðil
        } finally {
            storeLogout()
            navigate('/login')
        }
    }

    return { login, register, logout, loading, error, isAuthenticated, role, username }
}