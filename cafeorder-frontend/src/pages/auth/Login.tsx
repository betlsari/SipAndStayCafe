// cafeorder-frontend/src/pages/auth/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// TS1484 hatasý için: LoginRequest'i "import type" ile içe aktarýyoruz
import { authApi } from '../../api/auth.api';
import type { LoginRequest } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    // TS6385 uyarýsý için React.FormEvent tipini açýkça belirtiyoruz
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // TS2322 hatasý çözümü: api/auth.api.ts dosyasýnda 
        // LoginRequest interface'inin "email" alanýna sahip olduðundan emin olun.
        const loginData: LoginRequest = { email, password };

        try {
            const response = await authApi.login(loginData);
            const { user, token, refreshToken } = response.data;

            setAuth(user, token, refreshToken);

            if (user.role === 'Owner' || user.role === 'Admin') {
                navigate('/admin');
            } else if (user.role === 'Cashier') {
                navigate('/cashier/orders');
            } else {
                navigate('/kitchen');
            }

        }  catch (err: unknown) {
            // Tip güvenliði için hatanýn Axios hatasý olup olmadýðýný kontrol ediyoruz
            let errorMessage = 'Giriþ baþarýsýz. Bilgilerinizi kontrol edin.';

            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }

            setError(errorMessage);
            console.error("Giriþ hatasý:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-orange-600">CafeOrder</h2>
                    <p className="text-gray-500 mt-2 text-sm">Lütfen oturum açýn</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                        <input
                            type="email"
                            required
                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Þifre</label>
                        <input
                            type="password"
                            required
                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-lg text-white font-bold bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300"
                    >
                        {loading ? 'Giriþ Yapýlýyor...' : 'Giriþ Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// TS1192: "has no default export" hatasý için bu satýr kritik
export default Login;