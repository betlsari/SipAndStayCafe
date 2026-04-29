import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
})

// ─── Request Interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{
    resolve: (value: string) => void
    reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token!)
        }
    })
    failedQueue = []
}

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return axiosInstance(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = localStorage.getItem('refreshToken')

            if (!refreshToken) {
                isRefreshing = false
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(error)
            }

            try {
                const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refreshToken,
                })

                const newAccessToken = data.accessToken
                localStorage.setItem('accessToken', newAccessToken)

                axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
                processQueue(null, newAccessToken)

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                return axiosInstance(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default axiosInstance