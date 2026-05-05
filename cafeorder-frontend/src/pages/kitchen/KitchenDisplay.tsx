import { useState, useEffect, useCallback } from 'react'
import { orderApi } from '../../api/order.api'
import { useOrderHub } from '../../hooks/useOrderHub'
// import satırına OrderDto ekleyin:
import type { OrderItemDto, KitchenOrderDto, OrderStatus, OrderDto } from '../../types/index'
import KitchenOrderCard from '../../components/kitchen/KitchenOrderCard'

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

const COLUMNS: { status: KitchenCard['status']; label: string; emoji: string; dotBg: string }[] = [
    { status: 'Received', label: 'Yeni Siparişler', emoji: '🆕', dotBg: '#ffe66d' },
    { status: 'BeingPrepared', label: 'Hazırlanıyor', emoji: '👨‍🍳', dotBg: '#d4edff' },
    { status: 'Ready', label: 'Hazır / Teslim', emoji: '✅', dotBg: '#d4edda' },
]

// toOrderDto fonksiyonunu şununla değiştirin:
// toOrderDto fonksiyonunu şununla değiştirin:
function toOrderDto(card: KitchenCard): OrderDto {
    return {
        id: card.orderId,
        status: card.status,
        items: card.items,
        createdAt: card.createdAt,
        note: card.note ?? undefined,
        sessionId: '',
        total : card.total,
    }
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

    const handleAdvance = useCallback(async (orderId: string, newStatus: OrderStatus) => {
        setCards((prev) =>
            prev.map((c) =>
                c.orderId === orderId
                    ? { ...c, status: newStatus as KitchenCard['status'], readyAt: newStatus === 'Ready' ? Date.now() : c.readyAt }
                    : c
            )
        )
        try {
            await orderApi.updateOrderStatus(orderId, newStatus)
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

    const byStatus = (s: KitchenCard['status']) =>
        cards
            .filter((c) => {
                if (c.status !== s) return false
                if (s === 'Ready') {
                    if (!c.readyAt) return true
                    return Date.now() - c.readyAt < READY_AUTO_CLEAR_MS
                }
                return true
            })
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return (
        <>
            <style>{`
                .kd-page {
                    min-height: 100vh;
                    background: #FFF5F7;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    display: flex; flex-direction: column;
                }
                .kd-header {
                    position: sticky; top: 0; z-index: 10;
                    background: rgba(255,249,230,0.95);
                    backdrop-filter: blur(8px);
                    border-bottom: 2px solid #323232;
                    padding: 14px 24px;
                    display: flex; align-items: center; justify-content: space-between;
                    box-shadow: 0 3px 0 #32323215;
                }
                .kd-brand {
                    display: flex; align-items: center; gap: 12px;
                }
                .kd-brand-icon {
                    width: 40px; height: 40px;
                    background: #ffe66d;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    box-shadow: 3px 3px 0 #323232;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px;
                }
                .kd-brand-title {
                    margin: 0; font-size: 18px; font-weight: 900;
                    color: #323232; text-transform: uppercase;
                    letter-spacing: 0.5px; transform: rotate(-1deg);
                    display: inline-block;
                }
                .kd-brand-sub {
                    margin: 2px 0 0; font-size: 11px; color: #888; font-style: italic;
                }
                .kd-live-pill {
                    display: flex; align-items: center; gap: 6px;
                    border: 2px solid #323232;
                    border-radius: 20px;
                    padding: 6px 14px;
                    box-shadow: 3px 3px 0 #323232;
                    transition: background 0.3s;
                }
                .kd-live-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    border: 1.5px solid #323232;
                    display: inline-block;
                    animation: kd-pulse 2s infinite;
                }
                .kd-live-text {
                    font-size: 11px; font-weight: 700;
                    color: #323232; text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .kd-main {
                    flex: 1; padding: 24px;
                }
                .kd-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .kd-col-header {
                    display: flex; align-items: center; gap: 8px;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 2px dashed #323232;
                }
                .kd-col-emoji { font-size: 16px; }
                .kd-col-title {
                    margin: 0; font-size: 12px; font-weight: 900;
                    color: #323232; text-transform: uppercase;
                    letter-spacing: 0.08em; flex: 1;
                }
                .kd-col-count {
                    font-size: 12px; font-weight: 900; color: #323232;
                    background: #ffe66d;
                    border: 2px solid #323232;
                    padding: 2px 10px; border-radius: 20px;
                    box-shadow: 2px 2px 0 #323232;
                }
                .kd-cards {
                    display: flex; flex-direction: column; gap: 12px;
                }
                .kd-empty {
                    padding: 40px 20px;
                    border: 2px dashed #ccc;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    text-align: center;
                    color: #aaa; font-size: 13px; font-weight: 700;
                    background: #fffdf5;
                }
                .kd-error {
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 20px;
                    background: #ffecec;
                    border: 2px solid #ff6b6b;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    padding: 12px 16px;
                    font-size: 13px; color: #c0392b; font-weight: 700;
                    box-shadow: 3px 3px 0 #ff6b6b;
                }
                .kd-error-close {
                    background: none; border: none; cursor: pointer;
                    color: #c0392b; font-size: 18px; font-weight: 900;
                    margin-left: auto; font-family: inherit;
                    padding: 0 4px;
                }
                .kd-loading {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    height: 300px; gap: 12px;
                }
                .kd-loading-emoji {
                    font-size: 36px;
                    animation: kd-bounce 1s ease-in-out infinite;
                }
                .kd-loading-text {
                    font-size: 14px; color: #888;
                    font-weight: 700; font-style: italic;
                }
                @keyframes kd-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes kd-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>

            <div className="kd-page">
                <header className="kd-header">
                    <div className="kd-brand">
                        <div className="kd-brand-icon">🍳</div>
                        <div>
                            <p className="kd-brand-title">Mutfak Paneli</p>
                            <p className="kd-brand-sub">{cards.length} aktif sipariş</p>
                        </div>
                    </div>
                    <div
                        className="kd-live-pill"
                        style={{ background: connected ? '#d4edda' : '#ffecec' }}
                    >
                        <span
                            className="kd-live-dot"
                            style={{ background: connected ? '#4ecdc4' : '#ff6b6b' }}
                        />
                        <span className="kd-live-text">
                            {connected ? 'Canlı' : 'Bağlantı Kesildi'}
                        </span>
                    </div>
                </header>

                <main className="kd-main">
                    {error && (
                        <div className="kd-error">
                            <span>⚠️</span>
                            <span style={{ flex: 1 }}>{error}</span>
                            <button className="kd-error-close" onClick={() => setError(null)}>×</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="kd-loading">
                            <span className="kd-loading-emoji">🍳</span>
                            <p className="kd-loading-text">Siparişler yükleniyor…</p>
                        </div>
                    ) : (
                        <div className="kd-grid">
                            {COLUMNS.map((col) => (
                                <div key={col.status}>
                                    <div className="kd-col-header">
                                        <span className="kd-col-emoji">{col.emoji}</span>
                                        <h2 className="kd-col-title">{col.label}</h2>
                                        <span
                                            className="kd-col-count"
                                            style={{ background: col.dotBg }}
                                        >
                                            {byStatus(col.status).length}
                                        </span>
                                    </div>

                                    <div className="kd-cards">
                                        {byStatus(col.status).map((card) => (
                                            // as any'yi kaldırın:
                                            <KitchenOrderCard
                                                key={card.orderId}
                                                order={toOrderDto(card)}
                                                tableNumber={card.tableNumber}
                                                onStatusUpdated={(orderId, newStatus) =>
                                                    handleAdvance(orderId, newStatus)
                                                }
                                            />
                                        ))}
                                        {byStatus(col.status).length === 0 && (
                                            <div className="kd-empty">
                                                {col.status === 'Ready'
                                                    ? 'Teslim bekleyen yok'
                                                    : 'Bu aşamada sipariş yok'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    )
}