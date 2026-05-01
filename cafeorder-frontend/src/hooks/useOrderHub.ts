import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { createOrderHubConnection } from '../api/signalr'

interface UseOrderHubOptions {
    tableNumber?: number
    onNewOrder?: (payload: unknown) => void
    onOrderStatusUpdated?: (orderId: string, newStatus: string) => void
    joinKitchen?: boolean
}

export const useOrderHub = ({
    tableNumber,
    onNewOrder,
    onOrderStatusUpdated,
    joinKitchen = false,
}: UseOrderHubOptions) => {
    const connectionRef = useRef<signalR.HubConnection | null>(null)

    // Handler'larý ref'e al — connection kurulumu yeniden çalýþmadan handler'lar güncellenebilsin
    const onNewOrderRef = useRef(onNewOrder)
    const onStatusUpdatedRef = useRef(onOrderStatusUpdated)

    useEffect(() => { onNewOrderRef.current = onNewOrder }, [onNewOrder])
    useEffect(() => { onStatusUpdatedRef.current = onOrderStatusUpdated }, [onOrderStatusUpdated])

    const joinGroups = useCallback(async (conn: signalR.HubConnection) => {
        if (joinKitchen) {
            await conn.invoke('JoinKitchenGroup').catch(console.error)
        } else if (tableNumber) {
            await conn.invoke('JoinTableGroup', tableNumber).catch(console.error)
        }
    }, [joinKitchen, tableNumber])

    useEffect(() => {
        const connection = createOrderHubConnection()
        connectionRef.current = connection

        // Stable wrapper'lar — ref üzerinden güncel handler'ý çaðýrýr
        const handleNewOrder = (payload: unknown) => {
            onNewOrderRef.current?.(payload)
        }
        const handleStatusUpdated = (orderId: string, newStatus: string) => {
            onStatusUpdatedRef.current?.(orderId, newStatus)
        }

        connection.on('ReceiveNewOrder', handleNewOrder)
        connection.on('OrderStatusUpdated', handleStatusUpdated)

        connection.onreconnected(async () => {
            await joinGroups(connection)
        })

        const start = async () => {
            try {
                await connection.start()
                await joinGroups(connection)
            } catch (err) {
                console.error('[useOrderHub] Connection error:', err)
            }
        }

        start()

        return () => {
            connection.off('ReceiveNewOrder', handleNewOrder)
            connection.off('OrderStatusUpdated', handleStatusUpdated)

            if (!joinKitchen && tableNumber) {
                connection
                    .invoke('LeaveTableGroup', tableNumber)
                    .catch(() => { })
                    .finally(() => connection.stop())
            } else {
                connection.stop()
            }
        }
    }, [joinKitchen, tableNumber, joinGroups])

    return { connectionRef }
}