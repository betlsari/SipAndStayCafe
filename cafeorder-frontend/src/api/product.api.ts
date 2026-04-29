import axiosInstance from './axiosInstance'

export interface Product {
    id: number
    name: string
    description: string
    price: number
    category: string
    imageUrl?: string
    available: boolean
}

export interface CreateProductRequest {
    name: string
    description: string
    price: number
    category: string
    imageUrl?: string
}

export const productApi = {
    getProducts: () =>
        axiosInstance.get<Product[]>('/products'),

    getProductById: (id: number) =>
        axiosInstance.get<Product>(`/products/${id}`),

    getProductsByCategory: (category: string) =>
        axiosInstance.get<Product[]>(`/products/category/${category}`),

    createProduct: (data: CreateProductRequest) =>
        axiosInstance.post<Product>('/products', data),

    updateProduct: (id: number, data: Partial<CreateProductRequest>) =>
        axiosInstance.put<Product>(`/products/${id}`, data),

    deleteProduct: (id: number) =>
        axiosInstance.delete(`/products/${id}`),

    toggleAvailability: (id: number) =>
        axiosInstance.patch<Product>(`/products/${id}/toggle`),
}