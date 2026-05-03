import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'
import type { AuthUser, UserRole } from '../../types/index'

interface ApiErrorResponse {
    message?: string
    title?: string
}

export default function Login() {
    const navigate = useNavigate()
    const { setAuth, setLoading, isLoading } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    const getRoleRedirect = (roles: UserRole[]): string => {
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
                roles: raw.roles,
                refreshToken: raw.refreshToken,
                accessTokenExpiry: raw.accessTokenExpiry,
            }
            setAuth(user, raw.accessToken)
            navigate(getRoleRedirect(user.roles), { replace: true })
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>
            const status = axiosError.response?.status
            let message = 'Bir hata oluştu. Lütfen tekrar deneyin.'
            if (status === 401 || status === 400) {
                message = 'E-posta veya şifre hatalı.'
            } else if (status === 0 || !status) {
                message = 'Sunucuya bağlanılamıyor.'
            } else {
                message = axiosError.response?.data?.message ?? axiosError.response?.data?.title ?? message
            }
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F7F5F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                width: '100%', maxWidth: '380px',
                background: '#fff',
                borderRadius: '20px',
                border: '1px solid #E0DDD6',
                padding: '36px 32px',
                boxShadow: '0 8px 32px rgba(95,113,84,0.07)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: '#F0F4EC',
                        borderRadius: '18px', margin: '0 auto 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '30px',
                    }}>☕</div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#2C3528', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Sip & Stay</h1>
                    <p style={{ fontSize: '13px', color: '#8A8478', margin: 0 }}>Yönetim Paneli</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            E-posta
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="personel@kafe.com"
                            style={{
                                border: '1px solid #D8D4CC', borderRadius: '12px',
                                padding: '11px 14px', fontSize: '14px', color: '#2C3528',
                                background: '#FDFCF9', outline: 'none',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#82A76B'}
                            onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            style={{
                                border: '1px solid #D8D4CC', borderRadius: '12px',
                                padding: '11px 14px', fontSize: '14px', color: '#2C3528',
                                background: '#FDFCF9', outline: 'none',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#82A76B'}
                            onBlur={e => e.target.style.borderColor = '#D8D4CC'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: '#FAE8EE', border: '1px solid #F4C0D0',
                            borderRadius: '10px', padding: '10px 14px',
                        }}>
                            <p style={{ fontSize: '13px', color: '#8B3A5A', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {import.meta.env.DEV && (
                        <div style={{
                            background: '#EDF4E8', border: '1px solid #C0D5AA',
                            borderRadius: '10px', padding: '10px 14px',
                        }}>
                            <p style={{ fontSize: '12px', color: '#4A7038', margin: '0 0 2px', fontWeight: 600 }}>Varsayılan giriş:</p>
                            <p style={{ fontSize: '12px', color: '#4A7038', margin: 0, fontFamily: 'monospace' }}>admin@sipandstay.com / Admin123!</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            marginTop: '4px',
                            background: isLoading ? '#8FAF80' : '#5F7154',
                            color: '#fff', border: 'none',
                            borderRadius: '13px', padding: '13px',
                            fontSize: '15px', fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            fontFamily: 'inherit',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <svg style={{ width: '16px', height: '16px', animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                Giriş yapılıyor…
                            </>
                        ) : 'Giriş Yap'}
                    </button>
                </form>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}