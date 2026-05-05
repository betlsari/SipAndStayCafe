import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'
import type { AuthUser, UserRole } from '../../types/index'
import './Login.css' // CSS dosyasını eklemeyi unutma!

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
        <div className="min-h-screen flex items-center justify-center bg-[#FFF5F7] font-sans overflow-hidden">
            <div className="doodle-wrapper">
                <input
                    type="checkbox"
                    id="doodle-flip"
                    className="doodle-toggle"
                    aria-label="Toggle Login and Sign up"
                />

                <div className="doodle-header">
                    <span className="doodle-mode-text login-text">Giriş Yap</span>
                    <label className="doodle-switch-label" htmlFor="doodle-flip" tabIndex={0}>
                        <span className="doodle-switch-handle"></span>
                    </label>
                    <span className="doodle-mode-text signup-text">Kayıt Ol</span>
                </div>

                <div className="doodle-card-scene">
                    {/* Süslemeler */}
                    <svg className="doodle-svg doodle-star" viewBox="0 0 24 24" fill="#FDA4AF" stroke="#323232" strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <svg className="doodle-svg doodle-sparkle" viewBox="0 0 24 24" fill="#A7F3D0" stroke="#323232" strokeWidth="1.5">
                        <path d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"></path>
                    </svg>

                    <div className="doodle-card-inner">
                        {/* ÖN YÜZ: GİRİŞ YAP */}
                        <div className="doodle-card-front">
                            {/* Başlığı iki satır yaparak daha estetik görünmesini sağlayabilirsin */}
                            <div className="doodle-title text-rose-500 text-center">
                                SIP AND STAY'E <br /> HOŞ GELDİN!
                            </div>
                            <form className="doodle-form" onSubmit={handleSubmit}>
                                <div className="doodle-input-wrapper">
                                    <input
                                        className="doodle-input border-rose-200"
                                        placeholder="E-Posta"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="doodle-input-wrapper">
                                    <input
                                        className="doodle-input border-rose-200"
                                        placeholder="Şifre"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="error-box">
                                        <p>{error}</p>
                                    </div>
                                )}

                                <button
                                    className="doodle-btn bg-rose-400"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Gidiyoruz...' : "Hadi Başlayalım!"}
                                </button>
                            </form>

                            {/* Dev Modunda Yardımcı Bilgi */}
                            {import.meta.env.DEV && (
                                <p className="dev-info">admin@sipandstay.com / Admin123!</p>
                            )}
                        </div>

                        {/* ARKA YÜZ: KAYIT OL (Mantık eklemek istersen burayı kullanabilirsin) */}
                        <div className="doodle-card-back">
                            <div className="doodle-title doodle-title-alt text-emerald-600">Bize Katıl!</div>
                            <form className="doodle-form" onSubmit={(e) => e.preventDefault()}>
                                <div className="doodle-input-wrapper">
                                    <input className="doodle-input border-emerald-200" placeholder="İsim" type="text" />
                                </div>
                                <div className="doodle-input-wrapper">
                                    <input className="doodle-input border-emerald-200" placeholder="E-Posta" type="email" />
                                </div>
                                <button className="doodle-btn doodle-btn-alt bg-emerald-400">Onayla!</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}