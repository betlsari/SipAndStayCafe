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
            setTimeout(() => setCalled(false), 30_000)
        } catch {
            toast.error('Garson çağrılamadı, lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    if (called) {
        return (
            <button
                disabled
                style={{
                    background: '#EDF2E8',
                    border: '1.5px solid #C8D5C0',
                    color: '#5F7154',
                    borderRadius: '14px',
                    padding: '14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'default',
                    fontFamily: 'system-ui, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                }}
            >
                <span style={{ fontSize: '14px' }}>✓</span>
                Çağrıldı
            </button>
        )
    }

    return (
        <button
            onClick={handleCall}
            disabled={loading}
            style={{
                background: '#FFFFFF',
                border: '1.5px solid #FDB5CE',
                color: '#8B3A5A',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'system-ui, sans-serif',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLElement).style.background = '#FAE8EE'
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FFFFFF'
            }}
        >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path
                    d="M10 2a4 4 0 0 1 4 4v1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a4 4 0 0 1 4-4z"
                    stroke="#8B3A5A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path d="M8 15h4M10 13v3" stroke="#8B3A5A" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {loading ? 'Çağrılıyor…' : 'Garson Çağır'}
        </button>
    )
}