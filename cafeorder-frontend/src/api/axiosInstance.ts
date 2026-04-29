// cafeorder-frontend/src/api/axiosInstance.ts
import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { authApi } from './auth.api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface RetryQueueItem {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

// Birden fazla 401 hatası gelirse istekleri kuyruğa almak için
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
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
    withCredentials: true, // HttpOnly cookie kullanımı için kritik
});

// Request Interceptor: Her isteğe güncel Access Token'ı ekle
axiosInstance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: 401 hatasında Silent Refresh yap ve kuyruğu yönet
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Eğer hata 401 ise ve bu isteği daha önce tekrar denemediysek
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {

            // Eğer şu an zaten bir refresh işlemi devam ediyorsa, bu isteği kuyruğa ekle
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
                // Refresh API'sini çağır (auth.api içinden)
                const response = await authApi.refreshToken();
                const { token, user } = response.data;

                // Yeni bilgileri Zustand Store'a kaydet
                useAuthStore.getState().setAuth(user, token);

                // Kuyrukta bekleyen diğer isteklere yeni token'ı gönder
                processQueue(null, token);

                // Asıl (ilk hata alan) isteği yeni token ile tekrarla
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                // Refresh işlemi de başarısız olursa (örneğin Refresh Token süresi dolmuşsa)
                processQueue(refreshError, null);
                useAuthStore.getState().clearAuth(); // Kullanıcıyı çıkış yaptır

                // Login sayfasına yönlendir (Loop olmaması için kontrol edilebilir)
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;