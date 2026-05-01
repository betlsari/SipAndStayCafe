import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { createCashierHubConnection } from '../api/signalr'

interface UseCashierHubProps {
    onTableWaitingForPayment: (data: { tableNumber: number; totalAmount: number }) => void
    onTableSessionClosed: (tableNumber: number) => void
}

export const useCashierHub = ({
    onTableWaitingForPayment,
    onTableSessionClosed,
}: UseCashierHubProps) => {
    useEffect(() => {
        const token = useAuthStore.getState().token
        if (!token) return

        const connection = createCashierHubConnection()

        connection.on('TableWaitingForPayment', onTableWaitingForPayment)
        connection.on('TableSessionClosed', onTableSessionClosed)

        connection.start().catch(console.error)

        return () => {
            connection.off('TableWaitingForPayment')
            connection.off('TableSessionClosed')
            connection.stop()
        }
    }, [onTableWaitingForPayment, onTableSessionClosed])
}

/* useEffect(() => {
// State güncelleyen çaðrýyý bir asenkron fonksiyon içine alarak cascading render uyarýsýný önlüyoruz
const initFetch = async () => {
    await fetchSessions()
}

initFetch()
}, [fetchSessions]) // fetchSessions zaten useCallback ile sarýldýðý için güvenle eklenebilir*/