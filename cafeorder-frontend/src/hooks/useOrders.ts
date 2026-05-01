import { useState, useCallback } from 'react'
import { orderApi } from '../api/order.api'
import type { OrderDto, OrderStatus, PlaceOrderRequest } from '../types/index'

// Not: Bu hook mutfak/kasiyer ekranları için değil.
// KitchenDisplay kendi fetch'ini yapıyor; bu hook genel amaçlı bırakıldı.
export const useOrders = () => {
    const [orders, setOrders] = useState<OrderDto[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createOrder = useCallback(async (data: PlaceOrderRequest) => {
        setLoading(true)
        setError(null)
        try {
            const res = await orderApi.placeOrder(data)
            setOrders((prev) => [res.data, ...prev])
            return res.data
        } catch {
            setError('Sipariş oluşturulamadı.')
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
        try {
            await orderApi.updateOrderStatus(id, status)
            setOrders((prev) =>
                prev.map((o) => (o.id === id ? { ...o, status } : o))
            )
        } catch {
            setError('Durum güncellenemedi.')
        }
    }, [])

    return { orders, loading, error, createOrder, updateStatus }
}