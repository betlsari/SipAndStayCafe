// cafeorder-frontend/src/api/axiosInstance.ts
//
// DEĞİŞİKLİKLER (önceki versiyona göre):
//   1. authApi import'u lazy (döngüsel bağımlılık kırıldı)
//   2. setAuth çağrısında artık response.data.token / response.data.user
//      kullanılıyor — auth.api.ts'deki refreshToken() metodu bu şekli döndürüyor
//   3. Tip tanımları eklendi

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
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10_000,
});

// ── Request Interceptor: Her isteğe Bearer token ekle ────────────────────────
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

// ── Response Interceptor: 401'de token yenile, kuyruğu yönet ─────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            // Zaten refresh devam ediyorsa kuyruğa al
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
                // Lazy import: döngüsel bağımlılığı kırar
                const { authApi } = await import('./auth.api');
                const response = await authApi.refreshToken();

                // auth.api.ts'deki refreshToken() { data: { token, user } } döndürüyor
                const { token, user } = response.data;

                // Store'u güncelle
                useAuthStore.getState().setAuth(user, token);

                // Kuyruktaki isteklere yeni token'ı ver
                processQueue(null, token);

                // Asıl isteği tekrarla
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().clearAuth();

                // Login döngüsüne girmeyi önle
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;