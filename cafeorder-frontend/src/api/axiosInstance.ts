import axios, {
    type AxiosInstance,
    AxiosError,
    type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../store/authStore';

console.log('BASE_URL:', import.meta.env.VITE_API_URL)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5291/api';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface RetryQueueItem {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

// Auth endpoint'leri için refresh yapılmamalı
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];
const isAuthEndpoint = (url?: string) =>
    AUTH_ENDPOINTS.some((e) => url?.includes(e));

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
    timeout: 15_000,
});

// ── Request Interceptor ──────────────────────────────────────────────────────
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

// ── Response Interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;
        const status = error.response?.status;
        const requestUrl = originalRequest?.url;

        // Auth endpoint'leri için 401/400 → direkt reject, refresh döngüsü yok
        if (isAuthEndpoint(requestUrl)) {
            return Promise.reject(error);
        }

        // 401 ve retry edilmemiş ve refresh token var → refresh dene
        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            const { user } = useAuthStore.getState();

            // Refresh token yoksa direkt login'e yönlendir
            if (!user?.refreshToken) {
                useAuthStore.getState().clearAuth();
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

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
                const { authApi } = await import('./auth.api');
                const response = await authApi.refreshToken();
                const { token, user: refreshedUser } = response.data;

                useAuthStore.getState().setAuth(refreshedUser, token);
                processQueue(null, token);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().clearAuth();

                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ── Global Toast Bildirimleri ────────────────────────────────────────
        // 401 login hataları için toast gösterme (Login sayfası kendi yönetir)
        if (status !== 401) {
            const { toast } = await import('sonner');

            if (status === undefined || status === 0) {
                toast.error('Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.');
            } else if (status === 403) {
                toast.error('Bu işlem için yetkiniz bulunmuyor.');
            } else if (status === 500) {
                toast.error('Sunucu tarafında bir hata oluştu.');
            } else if (status !== undefined && status >= 502 && status <= 504) {
                toast.error('Servis şu an kullanılamıyor, lütfen bekleyin.');
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;