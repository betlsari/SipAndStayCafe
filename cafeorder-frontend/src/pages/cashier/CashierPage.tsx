import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cashierApi } from '../../api/cashier.api'
import { useCashierHub } from '../../hooks/useCashierHub'
import type { CashierSessionDto, PaymentStatus, PaymentMethod } from '../../types/index'
import { toast } from 'sonner'

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const elapsedMinutes = (iso: string) =>
    Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)

const STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; color: string; border: string }> = {
    None: { label: 'Bekliyor', bg: '#F0ECE4', color: '#6A6560', border: '#D8D4CC' },
    Pending: { label: 'Ödeme Talep', bg: '#FEF6EE', color: '#A05C1A', border: '#F0C88080' },
    Completed: { label: 'Ödendi', bg: '#EFF5EC', color: '#3D5C34', border: '#82A76B40' },
    Failed: { label: 'Başarısız', bg: '#FEF0EE', color: '#7A3530', border: '#E0907040' },
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
    const cfg = STATUS_CONFIG[status]
    return (
        <span style={{
            fontSize: '11px', fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '20px',
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
        }}>{cfg.label}</span>
    )
}

function MethodBadge({ method }: { method: PaymentMethod | null }) {
    if (!method || method === 'None') return null
    return (
        <span style={{
            fontSize: '11px', fontWeight: 500,
            padding: '3px 8px',
            borderRadius: '20px',
            background: '#F0ECE4',
            color: '#6A6560',
            border: '1px solid #D8D4CC',
        }}>
            {method === 'Cashier' ? '🧾 Kasa' : '💳 Online'}
        </span>
    )
}

function SessionCard({
    session, highlight, onClick,
}: {
    session: CashierSessionDto
    highlight: boolean
    onClick: (id: string) => void
}) {
    const mins = elapsedMinutes(session.openedAt)
    const isCompleted = session.paymentStatus === 'Completed'
    const isPending = session.paymentStatus === 'Pending'

    return (
        <div
            onClick={() => onClick(session.sessionId)}
            style={{
                position: 'relative',
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: highlight ? '2px solid #C8853A' : '1px solid #E0DDD6',
                boxShadow: highlight
                    ? '0 4px 16px rgba(200,133,58,0.15)'
                    : '0 2px 8px rgba(95,113,84,0.05)',
                cursor: 'pointer',
                opacity: isCompleted ? 0.55 : 1,
                transition: 'box-shadow 0.2s, transform 0.1s',
                fontFamily: 'system-ui, sans-serif',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(95,113,84,0.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = highlight ? '0 4px 16px rgba(200,133,58,0.15)' : '0 2px 8px rgba(95,113,84,0.05)' }}
        >
            {highlight && (
                <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    width: '10px', height: '10px',
                    borderRadius: '50%', background: '#C8853A',
                    animation: 'ping 1s infinite',
                }} />
            )}

            {isPending && !highlight && (
                <div style={{
                    position: 'absolute', top: '-1px', left: '16px', right: '16px',
                    height: '3px', background: '#C8853A',
                    borderRadius: '0 0 4px 4px',
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '28px', fontWeight: 800,
                        color: '#2C3528', letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}>{session.tableNumber}</span>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#8A8478' }}>
                        {formatTime(session.openedAt)} · {mins}dk
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <PaymentBadge status={session.paymentStatus} />
                    <MethodBadge method={session.paymentMethod} />
                </div>
            </div>

            <div style={{
                display: 'flex', alignItems: 'center',
                borderTop: '1px solid #EDE9E0',
                paddingTop: '12px', gap: '16px',
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9A8E80' }}>Sipariş</p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#4A4840' }}>{session.orderCount}</p>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#9A8E80' }}>Toplam</p>
                    <p style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#5F7154' }}>
                        {formatCurrency(session.totalAmount)}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function CashierPage() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState<CashierSessionDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [highlightedTables, setHighlightedTables] = useState<Set<number>>(new Set())
    const [, setTick] = useState(0)

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 60_000)
        return () => clearInterval(id)
    }, [])

    const fetchSessions = useCallback(async () => {
        try {
            const res = await cashierApi.getActiveSessions()
            setSessions(res.data)
        } catch {
            setError('Masalar yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        cashierApi.getActiveSessions()
            .then(res => { if (!cancelled) { setSessions(res.data); setLoading(false) } })
            .catch(() => { if (!cancelled) { setError('Masalar yüklenemedi.'); setLoading(false) } })
        return () => { cancelled = true }
    }, [])

    const handleTableWaiting = useCallback(
        (payload: unknown) => {
            const data = payload as { tableNumber?: number }
            if (typeof data?.tableNumber === 'number') {
                setHighlightedTables((prev) => new Set(prev).add(data.tableNumber!))
            }
            fetchSessions()
        },
        [fetchSessions]
    )

    const handleSessionClosed = useCallback(
        (payload: unknown) => {
            const tableNumber = typeof payload === 'number' ? payload : (payload as { tableNumber?: number })?.tableNumber
            if (typeof tableNumber === 'number') {
                setHighlightedTables((prev) => { const next = new Set(prev); next.delete(tableNumber); return next })
            }
            fetchSessions()
        },
        [fetchSessions]
    )

    const handleWaiterCalled = useCallback((payload: { tableNumber: number; note?: string | null }) => {
        toast(`🔔 Masa ${payload.tableNumber} garson istiyor!`, {
            description: payload.note ? `Not: ${payload.note}` : undefined,
            duration: 10_000,
        })
    }, [])

    useCashierHub({
        onTableWaitingForPayment: handleTableWaiting,
        onTableSessionClosed: handleSessionClosed,
        onWaiterCalled: handleWaiterCalled,
    })

    const active = sessions.filter((s) => s.paymentStatus !== 'Completed')
    const pending = active.filter((s) => s.paymentStatus === 'Pending')
    const waiting = active.filter((s) => s.paymentStatus === 'None')

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
                position: 'sticky', top: 0, zIndex: 10,
                background: 'rgba(247,245,240,0.95)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #E0DDD6',
                padding: '14px 20px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            background: '#5F7154',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px',
                        }}>🧾</div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2C3528', letterSpacing: '-0.01em' }}>
                                Kasiyer Paneli
                            </h1>
                            <p style={{ margin: 0, fontSize: '12px', color: '#8A8478' }}>
                                {active.length} aktif masa · {pending.length} ödeme bekliyor
                            </p>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#EFF5EC',
                        border: '1px solid #82A76B40',
                        borderRadius: '20px',
                        padding: '6px 12px',
                    }}>
                        <span style={{
                            width: '7px', height: '7px',
                            borderRadius: '50%', background: '#5F7154',
                            display: 'inline-block',
                            animation: 'pulse 2s infinite',
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#3D5C34' }}>Canlı</span>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px', flexDirection: 'column' }}>
                        <div style={{ fontSize: '28px' }}>☕</div>
                        <p style={{ color: '#8A8478', fontSize: '14px' }}>Yükleniyor…</p>
                    </div>
                )}

                {error && (
                    <div style={{
                        background: '#FEF0EE', border: '1px solid #E0907040',
                        borderRadius: '12px', padding: '12px 16px',
                        fontSize: '14px', color: '#7A3530',
                    }}>{error}</div>
                )}

                {!loading && (
                    <>
                        {pending.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8853A', display: 'inline-block' }} />
                                    <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#A05C1A', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                                        Ödeme Bekleyen · {pending.length}
                                    </h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                    {pending.map((s) => (
                                        <SessionCard
                                            key={s.sessionId}
                                            session={s}
                                            highlight={highlightedTables.has(s.tableNumber)}
                                            onClick={(id) => navigate(`/cashier/sessions/${id}`)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#82A76B', display: 'inline-block' }} />
                                <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#5F7154', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                                    Aktif Masalar · {waiting.length}
                                </h2>
                            </div>
                            {waiting.length === 0 ? (
                                <div style={{
                                    padding: '48px 20px',
                                    border: '1.5px dashed #D8D4CC',
                                    borderRadius: '16px',
                                    textAlign: 'center',
                                    color: '#B0AB9E',
                                    fontSize: '14px',
                                    background: '#FDFCF9',
                                }}>
                                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍃</div>
                                    Aktif masa yok
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                    {waiting
                                        .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())
                                        .map((s) => (
                                            <SessionCard
                                                key={s.sessionId}
                                                session={s}
                                                highlight={highlightedTables.has(s.tableNumber)}
                                                onClick={(id) => navigate(`/cashier/sessions/${id}`)}
                                            />
                                        ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
      `}</style>
        </div>
    )
}