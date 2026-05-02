import { useState } from 'react'
import { orderApi } from '../../api/order.api'
import { toast } from 'sonner'

interface Props {
    tableNumber: number
}

export default function WaiterCallButton({ tableNumber }: Props) {
    const [loading, setLoading] = useState(false)
    const [called, setCalled] = useState(false)

    const handleCall = async () => {
        if (loading || called) return
        setLoading(true)
        try {
            await orderApi.callWaiter({ tableNumber })
            setCalled(true)
            toast.success('Garson çağrıldı! En kısa sürede gelecek.')
            // 30 saniye sonra tekrar çağırılabilsin
            setTimeout(() => setCalled(false), 30_000)
        } catch {
            toast.error('Garson çağrılamadı, lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleCall}
            disabled={loading || called}
            className={`
        font-black text-sm uppercase tracking-wider py-4 rounded-2xl
        transition-all active:scale-[0.98]
        ${called
                    ? 'bg-zinc-200 text-zinc-400 cursor-default'
                    : 'bg-white border-2 border-zinc-200 text-zinc-700 hover:border-purple-300 hover:text-purple-700'
                }
      `}
        >
            {loading ? 'Çağrılıyor...' : called ? '✓ Garson Çağrıldı' : '🔔 Garson Çağır'}
        </button>
    )
}