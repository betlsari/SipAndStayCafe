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
    /** Must be bir tanesi: "Owner" | "Cashier" | "KitchenStaff" */
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
    accessTokenExpiry: string; // ISO 8601 UTC datetime string
    userId: string;
    displayName: string;
    roles: UserRole[]; // ✅ string[] yerine direkt UserRole[] yapıldı
}

/**
 * useAuthStore.setAuth() metodu AuthUser tipinde bir nesne bekler.
 */
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
     * Backend: AuthController.Login
     */
    login: (data: LoginRequest) =>
        axiosInstance.post<AuthResponse>('/auth/login', data),

    /**
     * POST /api/auth/register-staff
     * Owner (Admin) yetkisi gerektirir.
     * Backend: AuthController.RegisterStaff
     */
    registerStaff: (data: RegisterStaffRequest) =>
        axiosInstance.post<AuthResponse>('/auth/register-staff', data),

    /**
     * POST /api/auth/refresh
     * 401 hatalarında Axios Interceptor tarafından tetiklenir.
     * Backend: AuthController.RefreshToken
     */
    refreshToken: async (): Promise<{ data: RefreshResponse }> => {
        // Import döngüsünü engellemek için store'u fonksiyon içinde dinamik import ediyoruz
        const { useAuthStore } = await import('../store/authStore');
        const state = useAuthStore.getState();

        const payload: RefreshTokenRequest = {
            accessToken: state.token ?? '',
            refreshToken: state.user?.refreshToken ?? '',
        };

        const response = await axiosInstance.post<AuthResponse>(
            '/auth/refresh',
            payload,
        );

        const raw = response.data;

        // Backend'den gelen ham veriyi Interceptor'ın işleyebileceği hale getiriyoruz
        const shaped: RefreshResponse = {
            token: raw.accessToken,
            user: {
                userId: raw.userId,
                displayName: raw.displayName,
                roles: raw.roles as UserRole[], // ✅ Tip zorlaması (Casting) eklendi
                refreshToken: raw.refreshToken,
                accessTokenExpiry: raw.accessTokenExpiry,
            },
        };

        return { data: shaped };
    },

    /**
     * POST /api/auth/logout
     * Mevcut refresh token'ı server tarafında geçersiz kılar.
     * Backend: AuthController.Logout[cite: 1]
     */
    logout: async (): Promise<void> => {
        const { useAuthStore } = await import('../store/authStore');
        const state = useAuthStore.getState();
        const refreshToken = state.user?.refreshToken;

        if (refreshToken) {
            // Backend string tipinde bir body beklediği için stringify kullanıyoruz[cite: 1]
            await axiosInstance.post('/auth/logout', JSON.stringify(refreshToken), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
    },
};