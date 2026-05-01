import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'
import type { AuthUser, UserRole } from '../../types/index'

export default function Login() {
    const navigate = useNavigate()
    const { setAuth, setLoading, isLoading } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    // ✅ type olduğu için manuel liste
    const validRoles: UserRole[] = ['Owner', 'Cashier', 'KitchenStaff']

    // ✅ string[] → UserRole[] dönüşümü (type-safe)
    const mapRoles = (roles: string[]): UserRole[] => {
        return roles.filter((r): r is UserRole =>
            validRoles.includes(r as UserRole)
        )
    }

    const getRoleRedirect = (roles: UserRole[]) => {
        if (roles.includes('Owner')) return '/admin'
        if (roles.includes('Cashier')) return '/cashier'
        if (roles.includes('KitchenStaff')) return '/kitchen'
        return '/login'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await authApi.login({ email, password })
            const raw = res.data

            const user: AuthUser = {
                userId: raw.userId,
                displayName: raw.displayName,
                roles: mapRoles(raw.roles), // ✅ FIX
                refreshToken: raw.refreshToken,
                accessTokenExpiry: raw.accessTokenExpiry,
            }

            setAuth(user, raw.accessToken)

            navigate(getRoleRedirect(user.roles))

        } catch (err) {
            console.error(err)
            setError('E-posta veya şifre hatalı.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Giriş Yap
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            E-posta
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="ornek@kafe.com"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
                    >
                        {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    )
}