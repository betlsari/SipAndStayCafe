// src/components/cashier/OrderRoundList.tsx
import { useState } from 'react'
import type { CashierOrderRoundDto } from '../../types/index'

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    Received: { label: 'Alındı', className: 'bg-yellow-100 text-yellow-700' },
    BeingPrepared: { label: 'Hazırlanıyor', className: 'bg-blue-100 text-blue-700' },
    Ready: { label: 'Hazır', className: 'bg-green-100 text-green-700' },
}

interface OrderRoundItemProps {
    round: CashierOrderRoundDto
    index: number
}

function OrderRoundItem({ round, index }: OrderRoundItemProps) {
    const [open, setOpen] = useState(false)

    const statusCfg = ORDER_STATUS_CONFIG[round.status] ?? {
        label: round.status,
        className: 'bg-gray-100 text-gray-600',
    }

    const time = new Date(round.createdAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-5">
                        #{index + 1}
                    </span>
                    <span className="text-sm text-gray-500">{time}</span>
                    <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.className}`}
                    >
                        {statusCfg.label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-600">
                        ₺{round.roundTotal.toFixed(2)}
                    </span>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {open && (
                <div className="px-4 py-3 flex flex-col gap-2 border-t border-gray-100">
                    {round.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 font-medium">
                                    {item.quantity}x {item.productName}
                                </p>
                                {item.modifierSnapshots.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {item.modifierSnapshots.join(', ')}
                                    </p>
                                )}
                            </div>
                            <p className="text-sm font-semibold text-gray-600 ml-3 shrink-0">
                                ₺{item.itemTotal.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

interface OrderRoundListProps {
    rounds: CashierOrderRoundDto[]
}

export default function OrderRoundList({ rounds }: OrderRoundListProps) {
    if (rounds.length === 0) {
        return (
            <p className="text-sm text-gray-400 text-center py-4">
                Henüz sipariş turu yok.
            </p>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {rounds.map((round, i) => (
                <OrderRoundItem key={round.orderId} round={round} index={i} />
            ))}
        </div>
    )
}