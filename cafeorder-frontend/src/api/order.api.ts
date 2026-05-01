import axiosInstance from './axiosInstance'
import type {
    PlaceOrderRequest,
    OrderDto,
    TableOrderHistoryDto,
    WaiterCallRequest,
    KitchenOrderDto,
    OrderStatus,
} from '../types/index'

export const orderApi = {
    placeOrder: (data: PlaceOrderRequest) =>
        axiosInstance.post<OrderDto>('/orders', data),

    getTableOrderHistory: (tableNumber: number) =>
        axiosInstance.get<TableOrderHistoryDto>(`/orders/table/${tableNumber}`),

    updateOrderStatus: (id: string, newStatus: OrderStatus) =>
        axiosInstance.patch<void>(`/orders/${id}/status`, { newStatus }),

    callWaiter: (data: WaiterCallRequest) =>
        axiosInstance.post<void>('/orders/call-waiter', data),

    getKitchenActiveOrders: () =>
        axiosInstance.get<KitchenOrderDto[]>('/orders/kitchen'),
}