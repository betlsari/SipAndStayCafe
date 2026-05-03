import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { createOrderHubConnection, createKitchenHubConnection } from '../api/signalr'

interface UseOrderHubOptions {
    tableNumber?: number
    joinKitchen?: boolean
    onNewOrder?: (payload: unknown) => void
    onOrderStatusUpdated?: (orderId: string, newStatus: string) => void
}

export function useOrderHub({
    tableNumber,
    joinKitchen = false,
    onNewOrder,
    onOrderStatusUpdated,
}: UseOrderHubOptions) {
    const connectionRef = useRef<signalR.HubConnection | null>(null)
    const onNewOrderRef = useRef(onNewOrder)
    const onStatusRef = useRef(onOrderStatusUpdated)

    useEffect(() => { onNewOrderRef.current = onNewOrder }, [onNewOrder])
    useEffect(() => { onStatusRef.current = onOrderStatusUpdated }, [onOrderStatusUpdated])

    const startConnection = useCallback(async () => {
        // joinKitchen=true ise KitchenStaff token'ı ile bağlan
        // joinKitchen=false ise müşteri olarak anonymous bağlan
        const conn = joinKitchen
            ? createKitchenHubConnection()
            : createOrderHubConnection()

        connectionRef.current = conn

        conn.on('ReceiveNewOrder', (payload: unknown) => {
            onNewOrderRef.current?.(payload)
        })

        conn.on('OrderStatusUpdated', (payload: unknown) => {
            const raw = payload as Record<string, unknown>
            const orderId = (raw['OrderId'] ?? raw['orderId']) as string
            const newStatus = (raw['NewStatus'] ?? raw['newStatus']) as string
            if (orderId && newStatus) {
                onStatusRef.current?.(orderId, newStatus)
            }
        })

        conn.onreconnected(async () => {
            if (tableNumber) {
                await conn.invoke('JoinTableGroup', tableNumber).catch(() => { })
            }
            if (joinKitchen) {
                await conn.invoke('JoinKitchenGroup').catch(() => { })
            }
        })

        try {
            await conn.start()

            if (tableNumber) {
                await conn.invoke('JoinTableGroup', tableNumber).catch(() => { })
            }
            if (joinKitchen) {
                await conn.invoke('JoinKitchenGroup').catch(() => { })
            }
        } catch {
            // Sessizce geç — reconnect devreye girer
        }
    }, [tableNumber, joinKitchen])

    useEffect(() => {
        startConnection()
        return () => {
            connectionRef.current?.stop().catch(() => { })
        }
    }, [startConnection])

    return { connectionRef }
}