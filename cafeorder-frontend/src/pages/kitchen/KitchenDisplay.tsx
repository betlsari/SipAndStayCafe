// src/pages/kitchen/KitchenDisplay.tsx
import { useState, useEffect, useCallback } from 'react'
import { orderApi } from '../../api/order.api'
import { useOrderHub } from '../../hooks/useOrderHub'
import type { OrderItemDto, KitchenOrderDto } from '../../types/index'

// Ready siparişler kaç dakika sonra ekrandan kaldırılsın
const READY_AUTO_CLEAR_MS = 2 * 60 * 1000 // 2 dakika (daha kısa)

interface KitchenCard {
    orderId: string
    tableNumber: number
    status: 'Received' | 'BeingPrepared' | 'Ready'
    items: OrderItemDto[]
    total: number
    createdAt: string
    readyAt?: number
    note?: string | null
}

const COLUMNS: { status: KitchenCard['status']; label: string; color: string; dot: string }[] = [
    { status: 'Received', label: 'Yeni Siparişler', color: 'border-amber-400', dot: 'bg-amber-400' },
    { status: 'BeingPrepared', label: 'Hazırlanıyor', color: 'border-blue-400', dot: 'bg-blue-400' },
    { status: 'Ready', label: 'Hazır / Teslim', color: 'border-emerald-400', dot: 'bg-emerald-400' },
]

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

function Card({ card, onAdvance }: { card: KitchenCard; onAdvance: (id: string, next: KitchenCard['status']) => void }) {
    const next = nextStatus(card.status)
    const [remainSec, setRemainSec] = useState<number | null>(null)

    useEffect(() => {
        if (card.status !== 'Ready' || !card.readyAt) return
        const tick = () => {
            const diff = Math.ceil((card.readyAt! + READY_AUTO_CLEAR_MS - Date.now()) / 1000)
            setRemainSec(Math.max(0, diff))
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [card.status, card.readyAt])

    return (
        <div className={`bg-zinc-900 border-l-4 ${COLUMNS.find((c) => c.status === card.status)?.color} rounded-xl p-4 flex flex-col gap-3 shadow-lg`}>
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
            {/* Aksiyon butonları */}
            <div className="flex gap-2 pt-1">
                {next && (
                    <button
                        onClick={() => onAdvance(card.orderId, next)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all active:scale-95 ${card.status === 'Received'
                                ? 'bg-blue-500 hover:bg-blue-400'
                                : 'bg-emerald-500 hover:bg-emerald-400'
                            } text-white`}
                    >
                        {card.status === 'Received' ? '▶ Hazırlamaya Başla' : '✓ Hazır'}
                    </button>
                )}
                {card.status === 'Ready' && (
                    <div className="flex-1 py-2 rounded-lg text-xs font-semibold text-center text-emerald-400 border border-emerald-400/30 bg-emerald-400/5">
                        ✓ Teslim Bekleniyor
                        {remainSec !== null && remainSec > 0 && (
                            <span className="text-zinc-500 ml-1">· {remainSec}s</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function KitchenDisplay() {
    const [cards, setCards] = useState<KitchenCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [connected, setConnected] = useState(true)
    const [, setTick] = useState(0)

    // Elapsed timer
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 30_000)
        return () => clearInterval(id)
    }, [])

    // Auto-clear Ready orders after READY_AUTO_CLEAR_MS
    useEffect(() => {
        const id = setInterval(() => {
            setCards((prev) =>
                prev.filter((c) => {
                    if (c.status !== 'Ready' || !c.readyAt) return true
                    return Date.now() - c.readyAt < READY_AUTO_CLEAR_MS
                })
            )
        }, 5_000)
        return () => clearInterval(id)
    }, [])

    // Initial load - sadece Received ve BeingPrepared durumundaki siparişleri yükle
    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const res = await orderApi.getKitchenActiveOrders()
                if (cancelled) return
                setCards(
                    res.data
                        // Ready olanları başlangıçta yükleme (zaten teslim edilmiş sayılır)
                        .filter((o: KitchenOrderDto) => o.status !== 'Ready')
                        .map((o: KitchenOrderDto) => ({
                            orderId: o.orderId,
                            tableNumber: o.tableNumber,
                            status: o.status as KitchenCard['status'],
                            items: o.items,
                            total: o.total,
                            createdAt: o.createdAt,
                            note: o.note,
                        }))
                )
            } catch {
                if (!cancelled) setError('Siparişler yüklenemedi.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    const handleNewOrder = useCallback((payload: unknown) => {
        const raw = payload as Record<string, unknown>
        const orderRaw = (raw['Order'] ?? raw['order']) as Record<string, unknown> | undefined
        const tableNumber = (raw['TableNumber'] ?? raw['tableNumber']) as number | undefined
        if (!orderRaw || typeof tableNumber !== 'number') return
        const orderId = (orderRaw['id'] ?? orderRaw['Id']) as string | undefined
        if (!orderId) return

        // Ses bildirimi
        try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
            osc.start()
            osc.stop(ctx.currentTime + 0.4)
        } catch { /* ignore */ }

        setCards((prev) => {
            if (prev.some((c) => c.orderId === orderId)) return prev
            const card: KitchenCard = {
                orderId,
                tableNumber,
                status: ((orderRaw['status'] ?? orderRaw['Status']) as string ?? 'Received') as KitchenCard['status'],
                items: (orderRaw['items'] ?? orderRaw['Items']) as OrderItemDto[] ?? [],
                total: (orderRaw['total'] ?? orderRaw['Total']) as number ?? 0,
                createdAt: (orderRaw['createdAt'] ?? orderRaw['CreatedAt']) as string ?? new Date().toISOString(),
                note: (orderRaw['note'] ?? orderRaw['Note']) as string | null ?? null,
            }
            return [card, ...prev]
        })
    }, [])

    const handleStatusUpdated = useCallback((orderId: string, newStatus: string) => {
        setCards((prev) =>
            prev.map((c) =>
                c.orderId === orderId
                    ? {
                        ...c,
                        status: newStatus as KitchenCard['status'],
                        // Ready olunca timestamp kaydet (otomatik temizleme için)
                        readyAt: newStatus === 'Ready' ? Date.now() : c.readyAt,
                    }
                    : c
            )
        )
    }, [])

    const { connectionRef } = useOrderHub({
        joinKitchen: true,
        onNewOrder: handleNewOrder,
        onOrderStatusUpdated: handleStatusUpdated,
    })

    // Bağlantı durumu izleme
    useEffect(() => {
        const conn = connectionRef.current
        if (!conn) return
        conn.onclose(() => setConnected(false))
        conn.onreconnecting(() => setConnected(false))
        conn.onreconnected(() => setConnected(true))
    }, [connectionRef])

    const handleAdvance = useCallback(async (orderId: string, next: KitchenCard['status']) => {
        // Optimistic update
        setCards((prev) =>
            prev.map((c) =>
                c.orderId === orderId
                    ? { ...c, status: next, readyAt: next === 'Ready' ? Date.now() : c.readyAt }
                    : c
            )
        )
        try {
            await orderApi.updateOrderStatus(orderId, next)
        } catch {
            setError('Durum güncellenemedi.')
            // Hata durumunda yeniden yükle
            try {
                const res = await orderApi.getKitchenActiveOrders()
                setCards(
                    res.data
                        .filter((o: KitchenOrderDto) => o.status !== 'Ready')
                        .map((o: KitchenOrderDto) => ({
                            orderId: o.orderId,
                            tableNumber: o.tableNumber,
                            status: o.status as KitchenCard['status'],
                            items: o.items,
                            total: o.total,
                            createdAt: o.createdAt,
                            note: o.note,
                        }))
                )
            } catch { /* ignore */ }
        }
    }, [])

    // Kolona göre filtrele - Ready'ler sadece readyAt varsa göster
    const byStatus = (s: KitchenCard['status']) => {
        return cards
            .filter((c) => {
                if (c.status !== s) return false
                // Ready olanları sadece readyAt varsa göster ve süre dolmadıysa
                if (s === 'Ready') {
                    if (!c.readyAt) return true
                    return Date.now() - c.readyAt < READY_AUTO_CLEAR_MS
                }
                return true
            })
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
            <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <span className="text-xl font-bold tracking-tight font-mono text-purple-400">🍳 MUTFAK PANELİ</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${connected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                        {connected ? 'Canlı Bağlantı' : 'Bağlantı Kesildi…'}
                    </span>
                </div>
            </header>

            <main className="flex-1 p-6">
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        <p className="font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto hover:text-red-400 underline text-xs">Kapat</button>
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
                                    <span className="ml-auto text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">
                                        {byStatus(col.status).length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {byStatus(col.status).map((card) => (
                                        <Card key={card.orderId} card={card} onAdvance={handleAdvance} />
                                    ))}
                                    {byStatus(col.status).length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-zinc-900 rounded-2xl text-center text-zinc-700 text-xs">
                                            {col.status === 'Ready' ? 'Teslim bekleyen yok' : 'Bu aşamada sipariş yok'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}