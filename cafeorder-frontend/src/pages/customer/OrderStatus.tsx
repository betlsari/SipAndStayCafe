import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { orderApi } from '../../api/order.api'
import { tableApi } from '../../api/table.api'
import { useOrderHub } from '../../hooks/useOrderHub'
import { useCartStore } from '../../store/cartStore'
import type { TableOrderHistoryDto, OrderDto, OrderStatus as OrderStatusType } from '../../types/index'
import WaiterCallButton from '../../components/customer/WaiterCallButton'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { toast } from 'sonner'

const statusLabel: Record<string, string> = {
    Received: 'Alındı',
    BeingPrepared: 'Hazırlanıyor',
    Ready: 'Hazır',
}

const statusColor: Record<string, string> = {
    Received: 'bg-amber-100 text-amber-700 border border-amber-200',
    BeingPrepared: 'bg-blue-100 text-blue-700 border border-blue-200',
    Ready: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
}

export default function OrderStatus() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    // NaN guard: '?table=abc' veya parametre yoksa 0 döner, aşağıda yakalanır
    const tableNumber = Number(searchParams.get('table')) || 0

    const { sessionId: storedSessionId, setSessionId } = useCartStore()
    const [history, setHistory] = useState<TableOrderHistoryDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [paymentLoading, setPaymentLoading] = useState(false)

    const fetchHistory = useCallback(async () => {
        try {
            const res = await orderApi.getTableOrderHistory(tableNumber)
            setHistory(res.data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Sipariş geçmişi yüklenemedi.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [tableNumber])

    // sessionId store'da yoksa tableApi üzerinden çek
    const resolveSessionId = useCallback(async (): Promise<string | null> => {
        if (storedSessionId) return storedSessionId
        try {
            const tablesRes = await tableApi.getAll()
            const table = tablesRes.data.find(t => t.tableNumber === tableNumber)
            if (!table) return null
            const sessionRes = await tableApi.getActiveSession(table.id)
            const id = sessionRes.data?.id ?? null
            if (id) setSessionId(id)
            return id
        } catch {
            return null
        }
    }, [tableNumber, storedSessionId, setSessionId])

    const handleStatusUpdate = useCallback((orderId: string, newStatus: string) => {
        setHistory((prev) => {
            if (!prev) return null
            const targetOrder = prev.orders.find(o => o.id === orderId)
            if (targetOrder && newStatus === 'Ready') {
                toast.success(`${targetOrder.items[0]?.productName ?? 'Siparişiniz'} hazır! 🍽️`)
            }
            return {
                ...prev,
                orders: prev.orders.map(o =>
                    o.id === orderId ? { ...o, status: newStatus as OrderStatusType } : o
                ),
            }
        })
    }, [])

    // tableNumber geçildi → JoinTableGroup çağrılacak
    useOrderHub({
        tableNumber,
        onOrderStatusUpdated: handleStatusUpdate,
    })

    useEffect(() => {
        if (!tableNumber) {
            navigate('/menu')
            return
        }
        let cancelled = false
        const load = async () => {
            await fetchHistory()
            if (!cancelled) await resolveSessionId()
        }
        load()
        return () => { cancelled = true }
    }, [tableNumber, fetchHistory, resolveSessionId, navigate])

    const handlePayment = async () => {
        setPaymentLoading(true)
        try {
            const id = await resolveSessionId()
            if (id) {
                navigate(`/payment?session=${id}`)
            } else {
                toast.error('Oturum bulunamadı. Lütfen tekrar deneyin.')
            }
        } finally {
            setPaymentLoading(false)
        }
    }

    if (loading) return <LoadingSpinner />

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100">
                <p className="font-bold">{error}</p>
                <button onClick={fetchHistory} className="mt-2 text-sm underline">Tekrar Dene</button>
            </div>
        </div>
    )

    if (!history || history.orders.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <p className="text-gray-400 font-medium">Henüz siparişiniz bulunmuyor.</p>
            <button
                onClick={() => navigate(`/menu?table=${tableNumber}`)}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold"
            >
                Menüye Dön
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-zinc-50 pb-40">
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-zinc-900 tracking-tight">SİPARİŞLERİM</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Canlı Takip</span>
                    </div>
                </div>
                <div className="bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                    <span className="text-xs font-bold text-zinc-600">MASA {tableNumber}</span>
                </div>
            </header>

            <div className="px-4 py-6 flex flex-col gap-4 max-w-2xl mx-auto">
                {history.orders.map((order: OrderDto) => (
                    <div key={order.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor[order.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                                {statusLabel[order.status] ?? order.status}
                            </span>
                        </div>
                        <div className="p-5 flex flex-col gap-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-zinc-800">
                                            {item.quantity}× {item.productName}
                                        </p>
                                        {item.modifierSnapshots.length > 0 && (
                                            <p className="text-[11px] text-zinc-400 mt-0.5 italic">
                                                {item.modifierSnapshots.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-zinc-700">₺{item.itemTotal.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        {order.note && (
                            <div className="px-5 pb-4">
                                <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
                                    Not: {order.note}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-zinc-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
                <div className="max-w-2xl mx-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Toplam Tutar</span>
                        <span className="text-2xl font-black text-purple-600 tracking-tighter">
                            ₺{history.grandTotal.toFixed(2)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <WaiterCallButton tableNumber={tableNumber} />
                        <button
                            onClick={handlePayment}
                            disabled={paymentLoading}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-black text-sm uppercase tracking-wider py-4 rounded-2xl transition-all active:scale-[0.98]"
                        >
                            {paymentLoading ? 'İşleniyor...' : 'Ödeme Yap'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}