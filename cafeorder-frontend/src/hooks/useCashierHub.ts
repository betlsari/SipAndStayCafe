import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import { createCashierHubConnection } from '../api/signalr'

interface UseCashierHubOptions {
    onTableWaitingForPayment?: (payload: unknown) => void
    onTableSessionClosed?: (payload: unknown) => void
    onWaiterCalled?: (payload: { tableNumber: number; note?: string | null }) => void
}

export function useCashierHub({
    onTableWaitingForPayment,
    onTableSessionClosed,
    onWaiterCalled,
}: UseCashierHubOptions) {
    const connectionRef = useRef<signalR.HubConnection | null>(null)
    const waitingRef = useRef(onTableWaitingForPayment)
    const closedRef = useRef(onTableSessionClosed)
    const waiterRef = useRef(onWaiterCalled)

    useEffect(() => { waitingRef.current = onTableWaitingForPayment }, [onTableWaitingForPayment])
    useEffect(() => { closedRef.current = onTableSessionClosed }, [onTableSessionClosed])
    useEffect(() => { waiterRef.current = onWaiterCalled }, [onWaiterCalled])

    const startConnection = useCallback(async () => {
        const conn = createCashierHubConnection()
        connectionRef.current = conn

        conn.on('TableWaitingForPayment', (tableNumber: number, totalAmount: number) => {
            waitingRef.current?.({ tableNumber, totalAmount })
        })

        conn.on('TableSessionClosed', (tableNumber: number) => {
            closedRef.current?.(tableNumber)
        })

        conn.on('WaiterCalled', (payload: { tableNumber: number; note?: string | null }) => {
            waiterRef.current?.(payload)
        })

        try {
            await conn.start()
            console.log('SignalR connected!')
        } catch (err) {
            console.error('SignalR error:', err)
        }
    }, [])

    useEffect(() => {
        startConnection()
        return () => {
            connectionRef.current?.stop().catch(() => { })
        }
    }, [startConnection])

    return { connectionRef }
}