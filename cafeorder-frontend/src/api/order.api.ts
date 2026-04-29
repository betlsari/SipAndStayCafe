import axiosInstance from './axiosInstance'

export interface OrderItem {
    productId: number
    quantity: number
}

export interface CreateOrderRequest {
    tableNumber: number
    items: OrderItem[]
    note?: string
}

export interface Order {
    id: number
    tableNumber: number
    status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
    items: OrderItem[]
    totalPrice: number
    createdAt: string
    note?: string
}

export const orderApi = {
    createOrder: (data: CreateOrderRequest) =>
        axiosInstance.post<Order>('/orders', data),

    getOrders: () =>
        axiosInstance.get<Order[]>('/orders'),

    getOrderById: (id: number) =>
        axiosInstance.get<Order>(`/orders/${id}`),

    updateOrderStatus: (id: number, status: Order['status']) =>
        axiosInstance.patch<Order>(`/orders/${id}/status`, { status }),

    cancelOrder: (id: number) =>
        axiosInstance.delete(`/orders/${id}`),
}