import axiosInstance from './axiosInstance'
import type {
    PlaceOrderRequest,
    OrderDto,
    TableOrderHistoryDto,
    WaiterCallRequest,
    KitchenOrderDto,
    OrderStatus
} from '../types/index'

export const orderApi = {
    // Sipariş oluşturma (zaten vardı)
    placeOrder: (data: PlaceOrderRequest) =>
        axiosInstance.post<OrderDto>('/orders', data),

    // ✅ EKLENDİ - Tüm siparişleri getir
    getOrders: () =>
        axiosInstance.get<OrderDto[]>('/orders'),

    // ✅ EKLENDİ - createOrder (placeOrder ile aynı mantık)
    createOrder: (data: PlaceOrderRequest) =>
        axiosInstance.post<OrderDto>('/orders', data),

    // Masa sipariş geçmişi
    getTableOrderHistory: (tableNumber: number) =>
        axiosInstance.get<TableOrderHistoryDto>(`/orders/table/${tableNumber}`),

    // Sipariş durumu güncelleme
    updateOrderStatus: (id: string, newStatus: OrderStatus) =>
        axiosInstance.patch<void>(`/orders/${id}/status`, { newStatus }),

    // Garson çağırma
    callWaiter: (data: WaiterCallRequest) =>
        axiosInstance.post<void>('/orders/call-waiter', data),

    // Mutfaktaki aktif siparişler
    getKitchenActiveOrders: () =>
        axiosInstance.get<KitchenOrderDto[]>('/orders/kitchen'),
}