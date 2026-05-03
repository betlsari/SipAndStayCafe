import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { orderApi } from '../../api/order.api'
import { useOrderHub } from '../../hooks/useOrderHub'
import { useCartStore } from '../../store/cartStore'
import type { TableOrderHistoryDto, OrderDto, OrderStatus as OrderStatusType } from '../../types/index'
import WaiterCallButton from '../../components/customer/WaiterCallButton'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { toast } from 'sonner'

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
    Received: {
        label: 'Alındı',
        bg: '#FEF6EE',
        color: '#7A5C1A',
        border: 'rgba(245,158,11,0.2)',
    },
    BeingPrepared: {
        label: 'Hazırlanıyor',
        bg: '#EEF4FE',
        color: '#2B5FA0',
        border: 'rgba(59,130,246,0.18)',
    },
    Ready: {
        label: 'Hazır ✓',
        bg: '#EFF5EC',
        color: '#3D5C34',
        border: 'rgba(82,167,107,0.2)',
    },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? {
        label: status,
        bg: '#F0ECE4',
        color: '#6A6560',
        border: '#D8D4CC',
    }
    return (
        <span
            style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
            }}
        >
            {cfg.label}
        </span>
    )
}

function OrderCard({ order }: { order: OrderDto }) {
    return (
        <div
            style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #EDE9E0',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
            }}
        >
            {/* Card header */}
            <div
                style={{
                    padding: '11px 18px',
                    background: '#FDFCF9',
                    borderBottom: '1px solid #EDE9E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#B0AB9E',
                        letterSpacing: '0.04em',
                    }}
                >
                    {new Date(order.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
                <StatusBadge status={order.status} />
            </div>

            {/* Items */}
            <div
                style={{
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {order.items.map((item) => (
                    <div
                        key={item.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px',
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <p
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#2C3528',
                                    margin: 0,
                                }}
                            >
                                <span style={{ color: '#5F7154', fontWeight: 700, marginRight: '4px' }}>
                                    {item.quantity}×
                                </span>
                                {item.productName}
                            </p>
                            {item.modifierSnapshots.length > 0 && (
                                <p
                                    style={{
                                        fontSize: '11px',
                                        color: '#8A8478',
                                        margin: '3px 0 0',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {item.modifierSnapshots.join(', ')}
                                </p>
                            )}
                        </div>
                        <p
                            style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#4A4840',
                                margin: 0,
                                flexShrink: 0,
                            }}
                        >
                            ₺{item.itemTotal.toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Note */}
            {order.note && (
                <div
                    style={{
                        margin: '0 18px 14px',
                        background: '#FEF6EE',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '10px',
                        padding: '9px 13px',
                        fontSize: '12px',
                        color: '#7A5C1A',
                        fontStyle: 'italic',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                    }}
                >
                    <span style={{ flexShrink: 0 }}>📝</span>
                    <span>{order.note}</span>
                </div>
            )}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderStatus() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const tableNumber = Number(searchParams.get('table')) || 0

    const { sessionId: storedSessionId, setSessionId } = useCartStore()
    const [history, setHistory] = useState<TableOrderHistoryDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [paymentLoading, setPaymentLoading] = useState(false)

    const sessionIdRef = useRef(storedSessionId)
    useEffect(() => { sessionIdRef.current = storedSessionId }, [storedSessionId])

    const handleStatusUpdate = useCallback((orderId: string, newStatus: string) => {
        setHistory((prev) => {
            if (!prev) return null
            const targetOrder = prev.orders.find((o) => o.id === orderId)
            if (targetOrder && newStatus === 'Ready') {
                toast.success(`${targetOrder.items[0]?.productName ?? 'Siparişiniz'} hazır! 🍽️`)
            }
            return {
                ...prev,
                orders: prev.orders.map((o) =>
                    o.id === orderId ? { ...o, status: newStatus as OrderStatusType } : o
                ),
            }
        })
    }, [])

    useOrderHub({ tableNumber, onOrderStatusUpdated: handleStatusUpdate })

    useEffect(() => {
        if (!tableNumber) {
            navigate('/menu')
            return
        }
        let cancelled = false
        const load = async () => {
            try {
                const res = await orderApi.getTableOrderHistory(tableNumber)
                if (cancelled) return
                setHistory(res.data)
                if (!sessionIdRef.current) {
                    const sid = res.data.orders[0]?.sessionId
                    if (sid) setSessionId(sid)
                }
            } catch (err: unknown) {
                if (cancelled) return
                const message = err instanceof Error ? err.message : 'Sipariş geçmişi yüklenemedi.'
                setError(message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [tableNumber, navigate, setSessionId])

    const resolveSessionId = useCallback(async (): Promise<string | null> => {
        if (sessionIdRef.current) return sessionIdRef.current
        if (history?.orders[0]?.sessionId) return history.orders[0].sessionId
        try {
            const res = await orderApi.getTableOrderHistory(tableNumber)
            return res.data.orders[0]?.sessionId ?? null
        } catch {
            return null
        }
    }, [tableNumber, history])

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

    // ── Loading / error / empty states ────────────────────────────────────────

    if (loading) return <LoadingSpinner />

    if (error) return (
        <div
            style={{
                minHeight: '100vh',
                background: '#F7F5F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            <div
                style={{
                    background: '#FEF0EE',
                    border: '1px solid rgba(224,144,112,0.4)',
                    borderRadius: '14px',
                    padding: '18px 24px',
                    textAlign: 'center',
                }}
            >
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#7A3530', margin: '0 0 10px' }}>
                    {error}
                </p>
                <button
                    onClick={() => { setLoading(true); setError(null) }}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        color: '#5F7154',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: 'inherit',
                    }}
                >
                    Tekrar Dene
                </button>
            </div>
        </div>
    )

    if (!history || history.orders.length === 0) return (
        <div
            style={{
                minHeight: '100vh',
                background: '#F7F5F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'center',
                gap: '16px',
            }}
        >
            <div style={{ fontSize: '32px' }}>🛒</div>
            <p style={{ fontSize: '14px', color: '#8A8478', fontWeight: 500 }}>
                Henüz siparişiniz bulunmuyor.
            </p>
            <button
                onClick={() => navigate(`/menu?table=${tableNumber}`)}
                style={{
                    background: '#5F7154',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                }}
            >
                Menüye Dön
            </button>
        </div>
    )

    // ── Main render ───────────────────────────────────────────────────────────

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#F7F5F0',
                paddingBottom: '160px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* ── Header ── */}
            <header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    background: 'rgba(247,245,240,0.94)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid #EDE9E0',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: '17px',
                            fontWeight: 600,
                            color: '#2C3528',
                            margin: 0,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Siparişlerim
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span
                            style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: '#5F7154',
                                display: 'inline-block',
                                animation: 'pulse 2s infinite',
                            }}
                        />
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#8A8478',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}
                        >
                            Canlı Takip
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        background: '#EDF2E8',
                        border: '1px solid #C8D5C0',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#3D4A36',
                        letterSpacing: '0.05em',
                    }}
                >
                    Masa {tableNumber}
                </div>
            </header>

            {/* ── Order cards ── */}
            <div
                style={{
                    padding: '20px',
                    maxWidth: '560px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                }}
            >
                {history.orders.map((order: OrderDto) => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>

            {/* ── Sticky footer ── */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    background: 'rgba(247,245,240,0.97)',
                    backdropFilter: 'blur(8px)',
                    borderTop: '1px solid #EDE9E0',
                    padding: '18px 20px',
                }}
            >
                <div
                    style={{
                        maxWidth: '560px',
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                    }}
                >
                    {/* Total row */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 2px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#8A8478',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}
                        >
                            Toplam Tutar
                        </span>
                        <span
                            style={{
                                fontSize: '26px',
                                fontWeight: 700,
                                color: '#2C3528',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            ₺{history.grandTotal.toFixed(2)}
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Waiter call — pink accent, secondary action */}
                        <WaiterCallButton tableNumber={tableNumber} />

                        {/* Payment — green primary */}
                        <button
                            onClick={handlePayment}
                            disabled={paymentLoading}
                            style={{
                                background: paymentLoading ? '#8FAF80' : '#5F7154',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '14px',
                                padding: '14px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'system-ui, sans-serif',
                                transition: 'background 0.15s',
                            }}
                        >
                            {paymentLoading ? 'İşleniyor…' : 'Ödeme Yap'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.45; }
                }
            `}</style>
        </div>
    )
}