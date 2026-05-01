import { useState, useEffect, useCallback } from 'react'
import { orderApi } from '../../api/order.api'
import { useOrderHub } from '../../hooks/useOrderHub'
import type { OrderDto, OrderItemDto, KitchenOrderDto } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KitchenCard {
    orderId: string
    tableNumber: number
    status: 'Received' | 'BeingPrepared' | 'Ready'
    items: OrderItemDto[]
    total: number
    createdAt: string
    note?: string | null
}

interface NewOrderPayload {
    Order: OrderDto
    TableNumber: number
}

interface StatusUpdatedPayload {
    OrderId: string
    NewStatus: string
}

// ─── Column Config ────────────────────────────────────────────────────────────
const COLUMNS: { status: KitchenCard['status']; label: string; color: string; dot: string }[] = [
    { status: 'Received', label: 'Yeni', color: 'border-amber-400', dot: 'bg-amber-400' },
    { status: 'BeingPrepared', label: 'Hazırlanıyor', color: 'border-blue-400', dot: 'bg-blue-400' },
    { status: 'Ready', label: 'Hazır', color: 'border-emerald-400', dot: 'bg-emerald-400' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const elapsed = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    return `${Math.floor(diff / 60)}d ${diff % 60}s`
}

const nextStatus = (s: KitchenCard['status']): KitchenCard['status'] | null => {
    if (s === 'Received') return 'BeingPrepared'
    if (s === 'BeingPrepared') return 'Ready'
    return null
}

const nextLabel = (s: KitchenCard['status']) => {
    if (s === 'Received') return 'Hazırlamaya Başla'
    if (s === 'BeingPrepared') return 'Hazır'
    return null
}

// ─── Card Component ──────────────────────────────────────────────────────────
function Card({
    card,
    onAdvance,
}: {
    card: KitchenCard
    onAdvance: (id: string, next: KitchenCard['status']) => void
}) {
    const next = nextStatus(card.status)
    const label = nextLabel(card.status)

    return (
        <div className={`bg-zinc-900 border-l-4 ${COLUMNS.find(c => c.status === card.status)?.color} rounded-xl p-4 flex flex-col gap-3 shadow-lg animate-[fadeSlideIn_0.25s_ease-out]`}>
            <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-white">Masa {card.tableNumber}</span>
                <span className="text-xs text-zinc-400 tabular-nums">{elapsed(card.createdAt)}</span>
            </div>

            <ul className="flex flex-col gap-1.5">
                {card.items.map((item) => (
                    <li key={item.id} className="text-sm">
                        <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-zinc-100">{item.quantity}×</span>
                            <span className="text-zinc-200">{item.productName}</span>
                        </div>
                        {item.modifierSnapshots.length > 0 && (
                            <p className="ml-5 text-xs text-zinc-500 leading-relaxed italic">
                                {item.modifierSnapshots.join(', ')}
                            </p>
                        )}
                    </li>
                ))}
            </ul>

            {card.note && (
                <p className="text-xs text-amber-300 bg-amber-400/10 rounded-lg px-3 py-1.5 border border-amber-400/20">
                    📝 {card.note}
                </p>
            )}

            {next && label && (
                <button
                    onClick={() => onAdvance(card.orderId, next)}
                    className={`w-full mt-1 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all active:scale-95 ${card.status === 'Received' ? 'bg-blue-500 hover:bg-blue-400' : 'bg-emerald-500 hover:bg-emerald-400'
                        } text-white`}
                >
                    {label}
                </button>
            )}

            {card.status === 'Ready' && (
                <div className="w-full py-2.5 rounded-lg text-sm font-semibold text-center text-emerald-400 border border-emerald-400/30 bg-emerald-400/5">
                    ✓ Hazır
                </div>
            )}
        </div>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function KitchenDisplay() {
    const [cards, setCards] = useState<KitchenCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [, setTick] = useState(0)

    // Zamanlayıcı: 30 saniyede bir süreleri güncellemek için re-render tetikler
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 30_000)
        return () => clearInterval(id)
    }, [])

    // İlk Yükleme: Aktif mutfak siparişlerini çek
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const res = await orderApi.getKitchenActiveOrders()
                if (cancelled) return
                const initial: KitchenCard[] = res.data.map((o: KitchenOrderDto) => ({
                    orderId: o.orderId,
                    tableNumber: o.tableNumber,
                    status: o.status as KitchenCard['status'],
                    items: o.items,
                    total: o.total,
                    createdAt: o.createdAt,
                    note: o.note,
                }))
                setCards(initial)
            } catch {
                if (!cancelled) setError('Siparişler yüklenemedi.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    // SignalR: Yeni sipariş geldiğinde listeye ekle
    const handleNewOrder = useCallback((payload: NewOrderPayload) => {
        const { Order, TableNumber } = payload
        setCards((prev) => {
            if (prev.some((c) => c.orderId === Order.id)) return prev
            const card: KitchenCard = {
                orderId: Order.id,
                tableNumber: TableNumber,
                status: Order.status as KitchenCard['status'],
                items: Order.items,
                total: Order.total,
                createdAt: Order.createdAt,
                note: Order.note,
            }
            return [card, ...prev]
        })
    }, [])

    // SignalR: Sipariş durumu güncellendiğinde kartı güncelle
    const handleStatusUpdated = useCallback((payload: StatusUpdatedPayload) => {
        setCards((prev) =>
            prev.map((c) =>
                c.orderId === payload.OrderId
                    ? { ...c, status: payload.NewStatus as KitchenCard['status'] }
                    : c,
            ),
        )
    }, [])

    // Hub bağlantısı[cite: 1]
    const { connectionRef } = useOrderHub({
        joinKitchen: true,
        onNewOrder: handleNewOrder as (o: unknown) => void,
    })

    useEffect(() => {
        const conn = connectionRef.current
        if (!conn) return
        conn.on('OrderStatusUpdated', handleStatusUpdated)
        return () => { conn.off('OrderStatusUpdated', handleStatusUpdated) }
    }, [connectionRef, handleStatusUpdated])

    // Durum İlerletme Fonksiyonu[cite: 1]
    const handleAdvance = useCallback(async (orderId: string, next: KitchenCard['status']) => {
        setCards((prev) =>
            prev.map((c) => (c.orderId === orderId ? { ...c, status: next } : c)),
        )
        try {
            await orderApi.updateOrderStatus(orderId, next)
        } catch {
            setError('Durum güncellenemedi.')
        }
    }, [])

    const byStatus = (s: KitchenCard['status']) =>
        cards
            .filter((c) => c.status === s)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
            <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold tracking-tight font-mono text-purple-400">🍳 MUTFAK PANELI</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Canlı Bağlantı</span>
                </div>
            </header>

            <main className="flex-1 p-6">
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span className="text-lg">⚠️</span>
                        <p className="font-medium">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto hover:text-red-400 underline text-xs"
                        >
                            Kapat
                        </button>
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-zinc-500 italic">Siparişler hazırlanıyor...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {COLUMNS.map((col) => (
                            <div key={col.status} className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                                    <span className={`w-3 h-3 rounded-full ${col.dot}`} />
                                    <h2 className="text-sm font-black uppercase tracking-tighter text-zinc-400">{col.label}</h2>
                                    <span className="ml-auto text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">{byStatus(col.status).length}</span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {byStatus(col.status).map((card) => (
                                        <Card key={card.orderId} card={card} onAdvance={handleAdvance} />
                                    ))}
                                    {byStatus(col.status).length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-zinc-900 rounded-2xl text-center text-zinc-700 text-xs">Bu aşamada sipariş yok</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}