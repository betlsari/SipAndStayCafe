import { useState, useEffect, useCallback } from 'react'
import { orderApi } from '../../api/order.api'
import { useOrderHub } from '../../hooks/useOrderHub'
import type { OrderItemDto, KitchenOrderDto } from '../../types/index'

const READY_AUTO_CLEAR_MS = 2 * 60 * 1000

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

const COLUMNS: { status: KitchenCard['status']; label: string; accent: string; dot: string; bg: string }[] = [
    { status: 'Received', label: 'Yeni Siparişler', accent: '#C8853A', dot: '#C8853A', bg: '#FEF6EE' },
    { status: 'BeingPrepared', label: 'Hazırlanıyor', accent: '#3A7FC8', dot: '#3A7FC8', bg: '#EEF4FE' },
    { status: 'Ready', label: 'Hazır / Teslim', accent: '#5F7154', dot: '#5F7154', bg: '#EFF5EC' },
]

const elapsed = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    return `${Math.floor(diff / 60)}dk ${diff % 60}s`
}

const nextStatus = (s: KitchenCard['status']): KitchenCard['status'] | null => {
    if (s === 'Received') return 'BeingPrepared'
    if (s === 'BeingPrepared') return 'Ready'
    return null
}

function Card({ card, onAdvance }: { card: KitchenCard; onAdvance: (id: string, next: KitchenCard['status']) => void }) {
    const next = nextStatus(card.status)
    const col = COLUMNS.find((c) => c.status === card.status)!
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
        <div style={{
            background: '#FFFFFF',
            border: `1px solid ${col.accent}30`,
            borderLeft: `4px solid ${col.accent}`,
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(95,113,84,0.06)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#2C3528',
                        letterSpacing: '-0.02em',
                    }}>Masa {card.tableNumber}</span>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: col.accent,
                        background: `${col.accent}15`,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                    }}>{col.label}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#8A8478' }}>{elapsed(card.createdAt)}</span>
            </div>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {card.items.map((item) => (
                    <li key={item.id} style={{ fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: '#5F7154' }}>{item.quantity}×</span>
                            <span style={{ color: '#2C3528', fontWeight: 500 }}>{item.productName}</span>
                        </div>
                        {item.modifierSnapshots.length > 0 && (
                            <p style={{ margin: '2px 0 0 22px', fontSize: '12px', color: '#9A8E80', fontStyle: 'italic' }}>
                                {item.modifierSnapshots.join(', ')}
                            </p>
                        )}
                    </li>
                ))}
            </ul>

            {card.note && (
                <div style={{
                    background: '#FEF9EE',
                    border: '1px solid #F2D998',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#7A5C1A',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                }}>
                    <span>📝</span>
                    <span>{card.note}</span>
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                {next && (
                    <button
                        onClick={() => onAdvance(card.orderId, next)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '10px',
                            border: 'none',
                            background: card.status === 'Received' ? '#3A7FC8' : '#5F7154',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'opacity 0.15s',
                        }}
                    >
                        {card.status === 'Received' ? '▶ Hazırlamaya Başla' : '✓ Hazır'}
                    </button>
                )}
                {card.status === 'Ready' && (
                    <div style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid #5F715430',
                        background: '#EFF5EC',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#5F7154',
                    }}>
                        ✓ Teslim Bekleniyor
                        {remainSec !== null && remainSec > 0 && (
                            <span style={{ color: '#9A8E80', marginLeft: '6px', fontWeight: 400 }}>· {remainSec}s</span>
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

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 30_000)
        return () => clearInterval(id)
    }, [])

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

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const res = await orderApi.getKitchenActiveOrders()
                if (cancelled) return
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
                    ? { ...c, status: newStatus as KitchenCard['status'], readyAt: newStatus === 'Ready' ? Date.now() : c.readyAt }
                    : c
            )
        )
    }, [])

    const { connectionRef } = useOrderHub({
        joinKitchen: true,
        onNewOrder: handleNewOrder,
        onOrderStatusUpdated: handleStatusUpdated,
    })

    useEffect(() => {
        const conn = connectionRef.current
        if (!conn) return
        conn.onclose(() => setConnected(false))
        conn.onreconnecting(() => setConnected(false))
        conn.onreconnected(() => setConnected(true))
    }, [connectionRef])

    const handleAdvance = useCallback(async (orderId: string, next: KitchenCard['status']) => {
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

    const byStatus = (s: KitchenCard['status']) => {
        return cards
            .filter((c) => {
                if (c.status !== s) return false
                if (s === 'Ready') {
                    if (!c.readyAt) return true
                    return Date.now() - c.readyAt < READY_AUTO_CLEAR_MS
                }
                return true
            })
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F7F5F0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(247,245,240,0.95)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #E0DDD6',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px',
                        background: '#5F7154',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px',
                    }}>🍳</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2C3528', letterSpacing: '-0.01em' }}>
                            Mutfak Paneli
                        </h1>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8A8478' }}>
                            {cards.length} aktif sipariş
                        </p>
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: connected ? '#EFF5EC' : '#FEF0EE',
                    border: `1px solid ${connected ? '#82A76B40' : '#E0907040'}`,
                    borderRadius: '20px',
                    padding: '6px 12px',
                }}>
                    <span style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        background: connected ? '#5F7154' : '#C86050',
                        display: 'inline-block',
                        animation: 'pulse 2s infinite',
                    }} />
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: connected ? '#3D4A36' : '#7A3530',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.06em',
                    }}>
                        {connected ? 'Canlı' : 'Bağlantı Kesildi'}
                    </span>
                </div>
            </header>

            {/* Content */}
            <main style={{ flex: 1, padding: '24px' }}>
                {error && (
                    <div style={{
                        marginBottom: '20px',
                        background: '#FEF0EE',
                        border: '1px solid #E8B0A0',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '14px', color: '#7A3530',
                    }}>
                        <span>⚠️</span>
                        <span style={{ flex: 1 }}>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A3530', fontSize: '18px' }}
                        >×</button>
                    </div>
                )}

                {loading ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: '300px', gap: '12px',
                    }}>
                        <div style={{ fontSize: '32px' }}>🍳</div>
                        <p style={{ color: '#8A8478', fontSize: '14px', fontWeight: 500 }}>Siparişler yükleniyor…</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '20px',
                    }}>
                        {COLUMNS.map((col) => (
                            <div key={col.status}>
                                {/* Column Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    marginBottom: '16px',
                                    paddingBottom: '12px',
                                    borderBottom: `2px solid ${col.accent}25`,
                                }}>
                                    <span style={{
                                        width: '10px', height: '10px',
                                        borderRadius: '50%',
                                        background: col.dot,
                                        display: 'inline-block',
                                        flexShrink: 0,
                                    }} />
                                    <h2 style={{
                                        margin: 0,
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: '#4A4840',
                                        textTransform: 'uppercase' as const,
                                        letterSpacing: '0.08em',
                                        flex: 1,
                                    }}>{col.label}</h2>
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: col.accent,
                                        background: `${col.accent}15`,
                                        padding: '2px 10px',
                                        borderRadius: '20px',
                                    }}>{byStatus(col.status).length}</span>
                                </div>

                                {/* Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {byStatus(col.status).map((card) => (
                                        <Card key={card.orderId} card={card} onAdvance={handleAdvance} />
                                    ))}
                                    {byStatus(col.status).length === 0 && (
                                        <div style={{
                                            padding: '40px 20px',
                                            border: '1.5px dashed #D8D4CC',
                                            borderRadius: '14px',
                                            textAlign: 'center',
                                            color: '#B0AB9E',
                                            fontSize: '13px',
                                            background: '#FDFCF9',
                                        }}>
                                            {col.status === 'Ready' ? 'Teslim bekleyen yok' : 'Bu aşamada sipariş yok'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    )
}