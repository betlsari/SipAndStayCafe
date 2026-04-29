// cafeorder-frontend/src/store/authStore.ts
import { create } from 'zustand';
import type { AuthUser } from '../api/auth.api';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AuthState {
    /** JWT access token (in-memory only, never persisted to storage) */
    token: string | null;

    /** Raw refresh token string (in-memory only) */
    refreshToken: string | null;

    /** Decoded user info from the last successful auth response */
    user: AuthUser | null;

    /** True while an auth operation is in-flight */
    isLoading: boolean;

    // ─── Actions ──────────────────────────────────────────────────────────

    /** Called after successful login / register / token refresh */
    setAuth: (user: AuthUser, token: string) => void;

    /** Called after logout or when refresh fails */
    clearAuth: () => void;

    /** Toggle loading state (used by login page) */
    setLoading: (loading: boolean) => void;
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if the stored access token has not yet expired.
 * Relies on accessTokenExpiry stored inside the user object.
 */
const isTokenValid = (user: AuthUser | null): boolean => {
    if (!user?.accessTokenExpiry) return false;
    return new Date(user.accessTokenExpiry) > new Date();
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    refreshToken: null,
    user: null,
    isLoading: false,

    setAuth: (user, token) =>
        set({
            user,
            token,
            refreshToken: user.refreshToken,
            isLoading: false,
        }),

    clearAuth: () =>
        set({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
        }),

    setLoading: (loading) => set({ isLoading: loading }),
}));

// ─── Selectors (hook wrappers for convenience) ────────────────────────────────

/** Returns true if the user is authenticated and the token is still valid. */
export const useIsAuthenticated = () =>
    useAuthStore((s) => !!s.token && isTokenValid(s.user));

/** Returns the current user's roles array, or an empty array. */
export const useUserRoles = () =>
    useAuthStore((s) => s.user?.roles ?? []);

/**
 * Returns true if the current user has at least one of the given roles.
 * Example: useHasRole('Owner') or useHasRole('Cashier', 'Owner')
 */
export const useHasRole = (...roles: string[]) =>
    useAuthStore((s) => {
        const userRoles = s.user?.roles ?? [];
        return roles.some((r) => userRoles.includes(r));
    });

/** Returns the display name of the current user, or null. */
export const useDisplayName = () =>
    useAuthStore((s) => s.user?.displayName ?? null);