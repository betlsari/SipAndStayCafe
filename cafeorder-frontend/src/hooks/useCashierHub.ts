// src/hooks/useCashierHub.ts
import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { createCashierHubConnection } from '../api/signalr'

interface TableWaitingPayload {
    tableNumber: number
    totalAmount: number
}

interface UseCashierHubOptions {
    onTableWaitingForPayment?: (payload: TableWaitingPayload) => void
    onTableSessionClosed?: (tableNumber: number) => void
}

export const useCashierHub = ({
    onTableWaitingForPayment,
    onTableSessionClosed,
}: UseCashierHubOptions = {}) => {
    const connectionRef = useRef<signalR.HubConnection | null>(null)

    const startConnection = useCallback(async () => {
        const connection = createCashierHubConnection()
        connectionRef.current = connection

        if (onTableWaitingForPayment) {
            connection.on('TableWaitingForPayment', onTableWaitingForPayment)
        }

        if (onTableSessionClosed) {
            connection.on('TableSessionClosed', onTableSessionClosed)
        }

        try {
            await connection.start()
        } catch (err) {
            console.error('[useCashierHub] Connection error:', err)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        startConnection()

        return () => {
            connectionRef.current?.stop()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return { connectionRef }
}