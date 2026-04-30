import { useState } from 'react'
import { orderApi } from '../../api/order.api'

interface Props {
    tableNumber: number
}

export default function WaiterCallButton({ tableNumber }: Props) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const handleCall = async () => {
        if (status === 'loading' || status === 'success') return
        setStatus('loading')
        try {
            await orderApi.callWaiter({ tableNumber })
            setStatus('success')
            setTimeout(() => setStatus('idle'), 3000)
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
        }
    }

    const label = {
        idle: 'Garson Çaðýr',
        loading: 'Çaðrýlýyor...',
        success: 'Çaðrý Gönderildi',
        error: 'Hata, Tekrar Dene',
    }[status]

    const styles = {
        idle: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        loading: 'bg-gray-100 text-gray-400 cursor-not-allowed',
        success: 'bg-green-100 text-green-700 cursor-default',
        error: 'bg-red-100 text-red-600',
    }[status]

    return (
        <button
            onClick={handleCall}
            disabled={status === 'loading' || status === 'success'}
            className={`flex-1 font-semibold py-3 rounded-xl transition-colors text-sm ${styles}`}
        >
            {label}
        </button>
    )
}