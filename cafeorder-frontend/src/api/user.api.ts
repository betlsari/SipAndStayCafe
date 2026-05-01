import axiosInstance from './axiosInstance';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Backend'den dönen ham kullanıcı verisi yapısı
 */
export interface UserDto {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
    createdAt?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const userApi = {
    /**
     * Tüm personel ve kullanıcı listesini getirir.
     * GET /api/users
     */
    getAllUsers: () =>
        axiosInstance.get<UserDto[]>('/users'),

    /**
     * Belirli bir kullanıcıyı ID üzerinden getirir.
     * GET /api/users/:id
     */
    getUserById: (id: string) =>
        axiosInstance.get<UserDto>(`/users/${id}`),

    /**
     * Bir kullanıcı hesabını sistemden kalıcı olarak siler.
     * DELETE /api/users/:id
     */
    deleteUser: (id: string) =>
        axiosInstance.delete(`/users/${id}`),

    /**
     * Mevcut bir kullanıcının bilgilerini (ad, e-posta vb.) günceller.
     * PUT /api/users/:id[cite: 1]
     */
    updateUser: (id: string, data: Partial<Omit<UserDto, 'id'>>) =>
        axiosInstance.put<UserDto>(`/users/${id}`, data),
};