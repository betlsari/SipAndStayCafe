// src/components/kitchen/KitchenOrderCard.tsx
import { useState } from 'react'
import { orderApi } from '../../api/order.api'
import type { OrderDto, OrderStatus } from '../../types/index'

interface Props {
    order: OrderDto
    tableNumber: number
    onStatusUpdated: (orderId: string, newStatus: OrderStatus) => void
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; dot: string }> = {
    Received: {
        label: 'Alındı',
        bg: 'bg-amber-50 border-amber-200',
        dot: 'bg-amber-400',
    },
    BeingPrepared: {
        label: 'Hazırlanıyor',
        bg: 'bg-blue-50 border-blue-200',
        dot: 'bg-blue-500',
    },
    Ready: {
        label: 'Hazır',
        bg: 'bg-emerald-50 border-emerald-200',
        dot: 'bg-emerald-500',
    },
}

export default function KitchenOrderCard({ order, tableNumber, onStatusUpdated }: Props) {
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (newStatus: OrderStatus) => {
        setLoading(true)
        try {
            await orderApi.updateOrderStatus(order.id, newStatus)
            onStatusUpdated(order.id, newStatus)
        } catch (err) {
            console.error('Durum güncellenemedi:', err)
        } finally {
            setLoading(false)
        }
    }

    const config = statusConfig[order.status] ?? statusConfig.Received

    const time = new Date(order.createdAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className={`rounded-2xl border-2 p-4 flex flex-col gap-3 ${config.bg}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-800">Masa {tableNumber}</span>
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <span className="text-xs font-medium text-gray-500">{config.label}</span>
                </div>
                <span className="text-xs text-gray-400">{time}</span>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1.5">
                {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                        <span className="text-sm font-bold text-gray-700 w-6 shrink-0">
                            {item.quantity}x
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                            {item.modifierSnapshots.length > 0 && (
                                <p className="text-xs text-gray-500">
                                    {item.modifierSnapshots.join(' · ')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Note */}
            {order.note && (
                <div className="bg-white/70 rounded-lg px-3 py-2 border border-gray-200">
                    <p className="text-xs text-gray-500 italic">📝 {order.note}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                {order.status === 'Received' && (
                    <button
                        onClick={() => handleStatusChange('BeingPrepared')}
                        disabled={loading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                    >
                        {loading ? '...' : 'Hazırlanıyor'}
                    </button>
                )}
                {order.status === 'BeingPrepared' && (
                    <button
                        onClick={() => handleStatusChange('Ready')}
                        disabled={loading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                    >
                        {loading ? '...' : 'Hazır ✓'}
                    </button>
                )}
                {order.status === 'Ready' && (
                    <div className="flex-1 text-center text-sm font-semibold text-emerald-600 py-2">
                        ✓ Teslim Edildi
                    </div>
                )}
            </div>
        </div>
    )
}