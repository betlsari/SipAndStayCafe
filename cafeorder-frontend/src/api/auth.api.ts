import axiosInstance from './axiosInstance'

export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    accessToken: string
    refreshToken: string
    role: string
    username: string
}

export interface RegisterRequest {
    username: string
    password: string
    email: string
}

export const authApi = {
    login: (data: LoginRequest) =>
        axiosInstance.post<LoginResponse>('/auth/login', data),

    register: (data: RegisterRequest) =>
        axiosInstance.post('/auth/register', data),

    logout: () =>
        axiosInstance.post('/auth/logout'),

    refresh: (refreshToken: string) =>
        axiosInstance.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),
}