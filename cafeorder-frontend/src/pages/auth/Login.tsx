import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    // handleSubmit fonksiyonu içinde:
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await loginApi({ email, password });
            login(data.user, data.accessToken, data.refreshToken);

            if (data.user.role === 'Owner') navigate('/admin');
            else if (data.user.role === 'Cashier') navigate('/cashier');
            else navigate('/kitchen');
        } catch (err: unknown) { // any yerine unknown kullanýyoruz
            const errorMessage = err instanceof Error ? err.message : 'Giriþ baþarýsýz.';
            // Eðer axios hatasýysa daha detaylý mesaj alabilirsin:
            // setError((err as any).response?.data?.message || errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-3xl font-extrabold text-center text-orange-600 mb-8">CafeOrder</h2>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700">E-posta</label>
                        <input
                            type="email" required
                            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Þifre</label>
                        <input
                            type="password" required
                            className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all font-bold"
                    >
                        {loading ? 'Giriþ yapýlýyor...' : 'Giriþ Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;