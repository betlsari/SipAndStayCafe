import axios, {
    type AxiosInstance,
    AxiosError,
    type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7272/api';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface RetryQueueItem {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: RetryQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else if (token) prom.resolve(token);
    });
    failedQueue = [];
};

const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000, // Timeout süresi biraz artırıldı
});

// ── Request Interceptor: Her isteğe Bearer Token ekle ──────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response Interceptor: 401 Hatası, Refresh Token ve Kuyruk Yönetimi ─────────
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Eğer hata 401 (Unauthorized) ise ve bu bir tekrar isteği değilse
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            // Zaten bir refresh işlemi devam ediyorsa, isteği kuyruğa ekle
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Döngüsel bağımlılığı önlemek için authApi'yi dinamik import et
                const { authApi } = await import('./auth.api');
                const response = await authApi.refreshToken();
                const { token, user } = response.data;

                // Yeni token ve kullanıcı bilgilerini store'a kaydet
                useAuthStore.getState().setAuth(user, token);

                // Kuyrukta bekleyen diğer isteklere yeni token'ı gönder
                processQueue(null, token);

                // Orijinal isteği yeni token ile tekrarla
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh işlemi başarısız olursa her şeyi temizle ve login'e at
                processQueue(refreshError, null);
                useAuthStore.getState().clearAuth();

                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login'; // Kesin çözüm için href kullanıldı
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ── Global Hata Bildirimleri (Toast) ──────────────────────────────────────
        const status = error.response?.status;
        const { toast } = await import('sonner'); // Sadece hata anında import edilir

        if (status === undefined || status === 0) {
            toast.error('Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.');
        } else if (status === 403) {
            toast.error('Bu işlem için yetkiniz bulunmuyor.');
        } else if (status === 500) {
            toast.error('Sunucu tarafında bir hata oluştu.');
        } else if (status >= 502 && status <= 504) {
            toast.error('Servis şu an kullanılamıyor, lütfen bekleyin.');
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;