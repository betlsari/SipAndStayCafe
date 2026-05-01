import axiosInstance from './axiosInstance';
import type { UserRole } from '../types';

// ─── Request Types ────────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterStaffRequest {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
}

export interface RefreshTokenRequest {
    accessToken: string;
    refreshToken: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: string;
    userId: string;
    displayName: string;
    roles: UserRole[];
}

export interface AuthUser {
    userId: string;
    displayName: string;
    roles: UserRole[];
    refreshToken: string;
    accessTokenExpiry: string;
}

export interface RefreshResponse {
    token: string;
    user: AuthUser;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const authApi = {
    /**
     * POST /api/auth/login
     */
    login: (data: LoginRequest) =>
        axiosInstance.post<AuthResponse>('/auth/login', data),

    /**
     * POST /api/auth/register-staff
     */
    registerStaff: (data: RegisterStaffRequest) =>
        axiosInstance.post<AuthResponse>('/auth/register-staff', data),

    /**
     * POST /api/auth/refresh
     * Sadece geçerli refresh token varsa çağrılmalı.
     */
    refreshToken: async (): Promise<{ data: RefreshResponse }> => {
        const { useAuthStore } = await import('../store/authStore');
        const state = useAuthStore.getState();

        const accessToken = state.token ?? '';
        const refreshToken = state.user?.refreshToken ?? '';

        // Guard: token yoksa çağırma
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const payload: RefreshTokenRequest = { accessToken, refreshToken };

        // axiosInstance yerine doğrudan axios kullan → interceptor döngüsünü kır
        const { default: axios } = await import('axios');
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5291/api';

        const response = await axios.post<AuthResponse>(
            `${BASE_URL}/auth/refresh`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
        );

        const raw = response.data;

        const shaped: RefreshResponse = {
            token: raw.accessToken,
            user: {
                userId: raw.userId,
                displayName: raw.displayName,
                roles: raw.roles,
                refreshToken: raw.refreshToken,
                accessTokenExpiry: raw.accessTokenExpiry,
            },
        };

        return { data: shaped };
    },

    /**
     * POST /api/auth/logout
     */
    logout: async (): Promise<void> => {
        const { useAuthStore } = await import('../store/authStore');
        const state = useAuthStore.getState();
        const refreshToken = state.user?.refreshToken;

        if (refreshToken) {
            try {
                await axiosInstance.post('/auth/logout', JSON.stringify(refreshToken), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch {
                // Logout hatası sessizce geçilir — store zaten temizlenecek
            }
        }
    },
};