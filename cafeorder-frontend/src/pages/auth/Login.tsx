import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

const ROLE_REDIRECTS: Record<string, string> = {
    Owner: '/admin',
    Cashier: '/cashier',
    KitchenStaff: '/kitchen',
}

export default function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { setAuth, setLoading, isLoading } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await authApi.login({ email, password })
            const data = res.data

            const user = {
                userId: data.userId,
                displayName: data.displayName,
                roles: data.roles as import('../../types').UserRole[],
                refreshToken: data.refreshToken,
                accessTokenExpiry: data.accessTokenExpiry,
            }

            setAuth(user, data.accessToken)
            toast.success(`Hoþ geldin, ${data.displayName}`)

            // Redirect: gelen from state'i veya role bazlý default
            const from = (location.state as { from?: Location })?.from?.pathname
            const roleRedirect =
                data.roles.length > 0
                    ? (ROLE_REDIRECTS[data.roles[0]] ?? '/login')
                    : '/login'

            navigate(from ?? roleRedirect, { replace: true })
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? 'E-posta veya þifre hatalý.'
            setError(msg)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4">
            {/* Background texture */}
            <div
                className="fixed inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative w-full max-w-md">
                {/* Logo area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] mb-6">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 8h20M8 8c0 8 2 14 8 16 6-2 8-8 8-16M22 8V6a2 2 0 0 0-4 0v2"
                                stroke="#c8a96e"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <h1
                        className="text-3xl font-bold text-[#f0ede8] tracking-tight"
                        style={{ fontFamily: 'Georgia, serif' }}
                    >
                        Sip & Stay
                    </h1>
                    <p className="text-[#666] text-sm mt-1 tracking-wide">Personel Giriþi</p>
                </div>

                {/* Card */}
                <div className="bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[#888] uppercase tracking-widest">
                                E-posta
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@cafe.com"
                                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f0ede8] placeholder-[#444] text-sm outline-none transition-all duration-200 focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e]/30"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-[#888] uppercase tracking-widest">
                                Þifre
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-[#f0ede8] placeholder-[#444] text-sm outline-none transition-all duration-200 focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e]/30"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-[#2a1414] border border-[#4a2020] rounded-xl px-4 py-3 text-[#e07070] text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#c8a96e] hover:bg-[#d4b87c] disabled:bg-[#5a4a30] disabled:cursor-not-allowed text-[#0e0e0e] font-semibold py-3 rounded-xl transition-all duration-200 text-sm tracking-wide mt-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0e0e0e]/30 border-t-[#0e0e0e]" />
                                    Giriþ yapýlýyor...
                                </span>
                            ) : (
                                'Giriþ Yap'
                            )}
                        </button>
                    </form>

                    {/* Role hints */}
                    <div className="mt-6 pt-5 border-t border-[#1e1e1e]">
                        <p className="text-xs text-[#444] text-center mb-3">Roller</p>
                        <div className="flex justify-center gap-3">
                            {[
                                { label: 'Owner', color: '#c8a96e' },
                                { label: 'Cashier', color: '#6ea8c8' },
                                { label: 'Kitchen', color: '#6ec87a' },
                            ].map((role) => (
                                <span
                                    key={role.label}
                                    className="text-xs px-2.5 py-1 rounded-full border"
                                    style={{
                                        color: role.color,
                                        borderColor: `${role.color}33`,
                                        backgroundColor: `${role.color}11`,
                                    }}
                                >
                                    {role.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[#333] text-xs mt-6">
                    Müþteri menüsü için QR kodunu okutun
                </p>
            </div>
        </div>
    )
}