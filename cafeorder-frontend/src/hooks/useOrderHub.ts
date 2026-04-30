// src/hooks/useOrderHub.ts
import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { createOrderHubConnection } from '../api/signalr'

interface UseOrderHubOptions {
    tableNumber?: number
    onNewOrder?: (order: unknown) => void
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

    const startConnection = useCallback(async () => {
        const connection = createOrderHubConnection()
        connectionRef.current = connection

        if (onNewOrder) {
            connection.on('ReceiveNewOrder', onNewOrder)
        }

        if (onOrderStatusUpdated) {
            connection.on('OrderStatusUpdated', onOrderStatusUpdated)
        }

        connection.onreconnected(async () => {
            if (joinKitchen) {
                await connection.invoke('JoinKitchenGroup').catch(console.error)
            } else if (tableNumber) {
                await connection.invoke('JoinTableGroup', tableNumber).catch(console.error)
            }
        })

        try {
            await connection.start()

            if (joinKitchen) {
                await connection.invoke('JoinKitchenGroup')
            } else if (tableNumber) {
                await connection.invoke('JoinTableGroup', tableNumber)
            }
        } catch (err) {
            console.error('[useOrderHub] Connection error:', err)
        }
    }, [tableNumber, joinKitchen]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        startConnection()

        return () => {
            const conn = connectionRef.current
            if (!conn) return

            if (!joinKitchen && tableNumber) {
                conn
                    .invoke('LeaveTableGroup', tableNumber)
                    .catch(console.error)
                    .finally(() => conn.stop())
            } else {
                conn.stop()
            }
        }
    }, [tableNumber, joinKitchen]) // eslint-disable-line react-hooks/exhaustive-deps

    return { connectionRef }
}