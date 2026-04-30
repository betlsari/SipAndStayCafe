import axiosInstance from './axiosInstance'
import type {
    CategoryDto,
    CreateCategoryRequest,
    UpdateCategoryRequest,
} from '../types/index'

export const categoryApi = {
    getAll: () =>
        axiosInstance.get<CategoryDto[]>('/categories'),

    getById: (id: string) =>
        axiosInstance.get<CategoryDto>(`/categories/${id}`),

    create: (data: CreateCategoryRequest) =>
        axiosInstance.post<CategoryDto>('/categories', data),

    update: (id: string, data: UpdateCategoryRequest) =>
        axiosInstance.put<CategoryDto>(`/categories/${id}`, data),

    delete: (id: string) =>
        axiosInstance.delete<void>(`/categories/${id}`),
}