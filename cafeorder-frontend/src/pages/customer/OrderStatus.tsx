import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { orderApi } from '../../api/order.api'
import type { TableOrderHistoryDto, OrderDto } from '../../types/index'
import WaiterCallButton from '../../components/customer/WaiterCallButton'

const statusLabel: Record<string, string> = {
    Received: 'Alındı',
    BeingPrepared: 'Hazırlanıyor',
    Ready: 'Hazır',
}

const statusColor: Record<string, string> = {
    Received: 'bg-yellow-100 text-yellow-700',
    BeingPrepared: 'bg-blue-100 text-blue-700',
    Ready: 'bg-green-100 text-green-700',
}

export default function OrderStatus() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const tableNumber = Number(searchParams.get('table'))

    const [history, setHistory] = useState<TableOrderHistoryDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [paymentLoading, setPaymentLoading] = useState(false)

    const fetchHistory = async () => {
        if (!tableNumber) return
        try {
            const res = await orderApi.getTableOrderHistory(tableNumber)
            setHistory(res.data)
        } catch {
            setError('Siparişler yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
        const interval = setInterval(fetchHistory, 15000)
        return () => clearInterval(interval)
    }, [tableNumber])

    const handlePayment = async () => {
        if (!history) return
        setPaymentLoading(true)
        try {
            navigate(`/payment?table=${tableNumber}`)
        } finally {
            setPaymentLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Siparişler yükleniyor...</p>
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-red-500">{error}</p>
        </div>
    )

    if (!history || history.orders.length === 0) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-400">Henüz sipariş verilmedi.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Siparişlerim</h1>
                <span className="text-sm text-gray-500">Masa {tableNumber}</span>
            </div>

            {/* Orders */}
            <div className="px-4 py-4 flex flex-col gap-4">
                {history.orders.map((order: OrderDto) => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {statusLabel[order.status] ?? order.status}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {item.quantity}x {item.productName}
                                        </p>
                                        {item.modifierSnapshots.length > 0 && (
                                            <p className="text-xs text-gray-400">
                                                {item.modifierSnapshots.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        ₺{item.itemTotal.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {order.note && (
                            <p className="text-xs text-gray-400 mt-2 italic">Not: {order.note}</p>
                        )}

                        <div className="border-t mt-3 pt-2 flex justify-end">
                            <p className="text-sm font-bold text-purple-600">
                                ₺{order.total.toFixed(2)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Genel Toplam</span>
                    <span className="text-purple-600 font-bold text-lg">
                        ₺{history.grandTotal.toFixed(2)}
                    </span>
                </div>
                <div className="flex gap-3">
                    <WaiterCallButton tableNumber={tableNumber} />
                    <button
                        onClick={handlePayment}
                        disabled={paymentLoading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        Ödeme Yap
                    </button>
                </div>
            </div>
        </div>
    )
}