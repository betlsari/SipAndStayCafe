// cafeorder-frontend/src/api/auth.api.ts
import axiosInstance from './axiosInstance';

// ─── Request Types ────────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterStaffRequest {
    email: string;
    password: string;
    displayName: string;
    /** Must be one of: "Owner" | "Cashier" | "KitchenStaff" */
    role: 'Owner' | 'Cashier' | 'KitchenStaff';
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
    roles: string[];
}

/**
 * authApi.refreshToken() → axiosInstance'ın response interceptor'ı
 * { token, user } bekliyor.
 *
 * Backend AuthResponse'daki field'lardan:
 *   token  = accessToken
 *   user   = { userId, displayName, roles, refreshToken, accessTokenExpiry }
 *
 * Interceptor'da useAuthStore.getState().setAuth(user, token) çağrılıyor.
 * setAuth(user, token) imzasına göre user nesnesi AuthUser tipinde olmalı.
 */
export interface AuthUser {
    userId: string;
    displayName: string;
    roles: string[];
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
     * Returns full AuthResponse.
     */
    login: (data: LoginRequest) =>
        axiosInstance.post<AuthResponse>('/auth/login', data),

    /**
     * POST /api/auth/register-staff
     * Owner-only endpoint.
     */
    registerStaff: (data: RegisterStaffRequest) =>
        axiosInstance.post<AuthResponse>('/auth/register-staff', data),

    /**
     * POST /api/auth/refresh
     * Called by the axios response interceptor on 401.
     * Returns { token, user } shaped response for the interceptor.
     *
     * Backend döner: AuthResponse { accessToken, refreshToken, ... }
     * Interceptor beklediği: { token, user }
     * Bu method o dönüşümü burada yaparak interceptor'ı basit tutar.
     */
    refreshToken: async (): Promise<{ data: RefreshResponse }> => {
        // localStorage / sessionStorage kullanmıyoruz (artifact kısıtı yok ama
        // güvenlik açısından refreshToken memory'de veya authStore'da tutulur).
        // useAuthStore import döngüsünü kırmak için lazy import kullanıyoruz.
        const { useAuthStore } = await import('../store/authStore');
        const state = useAuthStore.getState();

        const payload: RefreshTokenRequest = {
            accessToken: state.token ?? '',
            refreshToken: state.refreshToken ?? '',
        };

        const response = await axiosInstance.post<AuthResponse>(
            '/auth/refresh',
            payload,
        );

        const raw = response.data;

        // Backend AuthResponse → Interceptor'ın beklediği { token, user } şekline dönüştür
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
     * Sends the current refreshToken to revoke it server-side.
     */
    logout: async (): Promise<void> => {
        const { useAuthStore } = await import('../store/authStore');
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
            await axiosInstance.post('/auth/logout', JSON.stringify(refreshToken), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
    },
};