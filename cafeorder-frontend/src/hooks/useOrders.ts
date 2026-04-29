import { useState, useEffect, useCallback } from 'react'
import { orderApi } from '../api/order.api'
import type { Order, CreateOrderRequest } from '../api/order.api'

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await orderApi.getOrders()
            setOrders(res.data)
        } catch {
            setError('Siparişler yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await orderApi.getOrders()
                if (!cancelled) setOrders(res.data)
            } catch {
                if (!cancelled) setError('Siparişler yüklenemedi.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [])

    const createOrder = async (data: CreateOrderRequest) => {
        setLoading(true)
        try {
            const res = await orderApi.createOrder(data)
            setOrders((prev) => [res.data, ...prev])
            return res.data
        } catch {
            setError('Sipariş oluşturulamadı.')
            return null
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: number, status: Order['status']) => {
        try {
            const res = await orderApi.updateOrderStatus(id, status)
            setOrders((prev) =>
                prev.map((o) => (o.id === id ? res.data : o))
            )
        } catch {
            setError('Durum güncellenemedi.')
        }
    }

    return { orders, loading, error, fetchOrders, createOrder, updateStatus }
}