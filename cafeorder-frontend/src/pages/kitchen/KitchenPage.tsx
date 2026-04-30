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

// ─── ReceiveNewOrder payload shape ───────────────────────────────────────────
interface NewOrderPayload {
    Order: OrderDto
    TableNumber: number
}

// ─── OrderStatusUpdated payload shape ────────────────────────────────────────
interface StatusUpdatedPayload {
    OrderId: string
    NewStatus: string
}

// ─── Column config ────────────────────────────────────────────────────────────
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

// ─── KitchenCard ─────────────────────────────────────────────────────────────
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
        <div
            className={`
        bg-zinc-900 border-l-4 ${COLUMNS.find(c => c.status === card.status)?.color}
        rounded-xl p-4 flex flex-col gap-3 shadow-lg
        animate-[fadeSlideIn_0.25s_ease-out]
      `}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-white">
                    Masa {card.tableNumber}
                </span>
                <span className="text-xs text-zinc-400 tabular-nums">{elapsed(card.createdAt)}</span>
            </div>

            {/* Items */}
            <ul className="flex flex-col gap-1.5">
                {card.items.map((item) => (
                    <li key={item.id} className="text-sm">
                        <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-zinc-100">
                                {item.quantity}×
                            </span>
                            <span className="text-zinc-200">{item.productName}</span>
                        </div>
                        {item.modifierSnapshots.length > 0 && (
                            <p className="ml-5 text-xs text-zinc-500 leading-relaxed">
                                {item.modifierSnapshots.join(', ')}
                            </p>
                        )}
                    </li>
                ))}
            </ul>

            {/* Note */}
            {card.note && (
                <p className="text-xs text-amber-300 bg-amber-400/10 rounded-lg px-3 py-1.5 border border-amber-400/20">
                    📝 {card.note}
                </p>
            )}

            {/* Action */}
            {next && label && (
                <button
                    onClick={() => onAdvance(card.orderId, next)}
                    className={`
            w-full mt-1 py-2.5 rounded-lg text-sm font-semibold tracking-wide
            transition-all duration-150 active:scale-95
            ${card.status === 'Received'
                            ? 'bg-blue-500 hover:bg-blue-400 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-white'}
          `}
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

// ─── Column ───────────────────────────────────────────────────────────────────
function Column({
    config,
    cards,
    onAdvance,
}: {
    config: (typeof COLUMNS)[number]
    cards: KitchenCard[]
    onAdvance: (id: string, next: KitchenCard['status']) => void
}) {
    return (
        <div className="flex flex-col gap-3 min-w-0">
            {/* Column header */}
            <div className="flex items-center gap-2 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot} flex-shrink-0`} />
                <span className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                    {config.label}
                </span>
                <span className="ml-auto text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {cards.length}
                </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
                {cards.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-700 py-10 text-center text-zinc-600 text-sm">
                        Sipariş yok
                    </div>
                )}
                {cards.map((card) => (
                    <Card key={card.orderId} card={card} onAdvance={onAdvance} />
                ))}
            </div>
        </div>
    )
}

// ─── KitchenPage ─────────────────────────────────────────────────────────────
export default function KitchenPage() {
    const [cards, setCards] = useState<KitchenCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [, setTick] = useState(0)

    // Re-render every 30s so elapsed times update
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 30_000)
        return () => clearInterval(id)
    }, [])

    // ── Initial load ──────────────────────────────────────────────────────────
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

    // ── SignalR: new order ────────────────────────────────────────────────────
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

    // ── SignalR: status updated ───────────────────────────────────────────────
    const handleStatusUpdated = useCallback((payload: StatusUpdatedPayload) => {
        setCards((prev) =>
            prev.map((c) =>
                c.orderId === payload.OrderId
                    ? { ...c, status: payload.NewStatus as KitchenCard['status'] }
                    : c,
            ),
        )
    }, [])

    // Single hub connection — ReceiveNewOrder wired via hook, OrderStatusUpdated via ref
    // because the payload is a single object { OrderId, NewStatus } while the hook
    // signature expects (orderId: string, newStatus: string) separately.
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

    // ── Advance status ────────────────────────────────────────────────────────
    const handleAdvance = useCallback(
        async (orderId: string, next: KitchenCard['status']) => {
            // Optimistic update
            setCards((prev) =>
                prev.map((c) => (c.orderId === orderId ? { ...c, status: next } : c)),
            )
            try {
                await orderApi.updateOrderStatus(orderId, next)
            } catch {
                // Rollback not implemented for brevity — re-fetch on error
                setError('Durum güncellenemedi.')
            }
        },
        [],
    )

    // ── Derived ───────────────────────────────────────────────────────────────
    const byStatus = (s: KitchenCard['status']) =>
        cards
            .filter((c) => c.status === s)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-bold tracking-tight font-mono">🍳 Mutfak</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-zinc-400">Canlı</span>
                </div>
            </header>

            {/* Body */}
            <main className="flex-1 p-4">
                {loading && (
                    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                        Yükleniyor…
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
                        {error}
                    </div>
                )}

                {!loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {COLUMNS.map((col) => (
                            <Column
                                key={col.status}
                                config={col}
                                cards={byStatus(col.status)}
                                onAdvance={handleAdvance}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Keyframes injected inline for portability */}
            <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
        </div>
    )
}