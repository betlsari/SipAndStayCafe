import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import type { AuthUser, UserRole } from '../../types/index';

/**
 * Backend'den dönen hata mesajı yapısı
 */
interface ApiErrorResponse {
    message?: string;
}

export default function Login() {
    const navigate = useNavigate();
    const { setAuth, setLoading, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    /**
     * Kullanıcı rolüne göre gidilecek sayfayı belirler
     */
    const getRoleRedirect = (roles: UserRole[]): string => {
        if (roles.includes('Owner')) return '/admin';
        if (roles.includes('Cashier')) return '/cashier';
        if (roles.includes('KitchenStaff')) return '/kitchen';
        return '/login';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. API İsteği
            const res = await authApi.login({ email, password });
            const raw = res.data;

            // 2. Kullanıcı verisini merkezi tiplerle uyumlu hale getir[cite: 1]
            const user: AuthUser = {
                userId: raw.userId,
                displayName: raw.displayName,
                roles: raw.roles as UserRole[], // Güvenli tip dönüşümü[cite: 1]
                refreshToken: raw.refreshToken,
                accessTokenExpiry: raw.accessTokenExpiry,
            };

            // 3. Global State (Zustand) güncellemesi[cite: 1]
            setAuth(user, raw.accessToken);

            // 4. Yetkiye göre yönlendirme
            const redirectPath = getRoleRedirect(user.roles);
            navigate(redirectPath);

        } catch (err) {
            // ✅ AxiosError kullanarak tip güvenliği sağlandı[cite: 1]
            const axiosError = err as AxiosError<ApiErrorResponse>;
            console.error('Giriş Hatası:', axiosError);

            const message = axiosError.response?.data?.message || 'E-posta veya şifre hatalı.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        Hoş Geldiniz
                    </h1>
                    <p className="text-gray-500 text-sm italic">Sip & Stay Cafe Yönetimi</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            E-posta Adresi
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            placeholder="admin@sipandstay.com"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md transition-all animate-in fade-in">
                            <p className="text-xs text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold rounded-xl py-3 text-sm shadow-lg shadow-purple-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Giriş Yapılıyor...</span>
                            </>
                        ) : (
                            'Giriş Yap'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}