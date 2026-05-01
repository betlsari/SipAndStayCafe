// cafeorder-frontend/src/api/axiosInstance.ts
import axios, {
    type AxiosInstance,
    AxiosError,
    type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7272/api'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean
}

interface RetryQueueItem {
    resolve: (token: string) => void
    reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: RetryQueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error)
        else if (token) prom.resolve(token)
    })
    failedQueue = []
}

const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10_000,
})

// ── Request Interceptor: Attach Bearer token ──────────────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

// ── Response Interceptor: 401 → refresh → retry ───────────────────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`
                        }
                        return axiosInstance(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true


            try {
                const { authApi } = await import('./auth.api')
                const response = await authApi.refreshToken()
                const { token, user } = response.data

                useAuthStore.getState().setAuth(user, token)
                processQueue(null, token)

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                }
                return axiosInstance(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                useAuthStore.getState().clearAuth()

                // window.location.href yerine history API — Router'ı bypass etmez
                if (!window.location.pathname.includes('/login')) {
                    window.history.pushState({}, '', '/login')
                    window.dispatchEvent(new PopStateEvent('popstate'))
                }
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
        // ── Global hata bildirimleri ──────────────────────────────────────
        // 401 zaten yukarıda ele alındı; refresh başarısızsa clearAuth çağrılır.
        const status = error.response?.status

        if (status === undefined || status === 0) {
            // Network hatası / sunucuya ulaşılamıyor
            const { toast } = await import('sonner')
            toast.error('Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.')
        } else if (status === 403) {
            const { toast } = await import('sonner')
            toast.error('Bu işlem için yetkiniz bulunmuyor.')
        } else if (status === 500) {
            const { toast } = await import('sonner')
            toast.error('Sunucu hatası oluştu. Lütfen tekrar deneyin.')
        } else if (status >= 502 && status <= 504) {
            const { toast } = await import('sonner')
            toast.error('Sunucu şu an yanıt vermiyor. Kısa süre sonra tekrar deneyin.')
        }

        return Promise.reject(error)
    },
)

export default axiosInstance