import axiosInstance from './axiosInstance'


// credentials için any yerine interface kullanýyoruz
export interface LoginCredentials {
    email: string;
    password?: string;
}

export const loginApi = async (credentials: LoginCredentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;

};

export const refreshApi = async (refreshToken: string) => {
    const response = await axiosInstance.post('/auth/refresh', { refreshToken });
    return response.data;
};

export const logoutApi = async () => {
    await axiosInstance.post('/auth/logout');
};
export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    user: {
        id: string;
        name: string;
        role: string;
    };
    token: string;        // Hata: LoginResponse içinde 'token' bulunamadý diyordu
    refreshToken: string;
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
    refreshToken: () => axiosInstance.post<LoginResponse>('/auth/refresh'), // refreshToken() fonksiyon ismi kontrolü
    logout: () =>
        axiosInstance.post('/auth/logout'),

    refresh: (refreshToken: string) =>
        axiosInstance.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),
}