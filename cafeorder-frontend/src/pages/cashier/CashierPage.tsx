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
    None: { label: 'Bekliyor', bg: '#f0ece4', color: '#6A6560', border: '#323232' },
    Pending: { label: 'Ödeme Talep', bg: '#ffe66d', color: '#323232', border: '#323232' },
    Completed: { label: 'Ödendi', bg: '#d4edda', color: '#323232', border: '#323232' },
    Failed: { label: 'Başarısız', bg: '#ffecec', color: '#c0392b', border: '#ff6b6b' },
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
    const cfg = STATUS_CONFIG[status]
    return (
        <span style={{
            fontSize: '10px', fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '20px',
            background: cfg.bg,
            color: cfg.color,
            border: `2px solid ${cfg.border}`,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
            boxShadow: `2px 2px 0 ${cfg.border}`,
        }}>{cfg.label}</span>
    )
}

function MethodBadge({ method }: { method: PaymentMethod | null }) {
    if (!method || method === 'None') return null
    return (
        <span style={{
            fontSize: '10px', fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '20px',
            background: '#ffffff',
            color: '#323232',
            border: '2px solid #323232',
            fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
            boxShadow: '2px 2px 0 #323232',
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
    const [hovered, setHovered] = useState(false)
    const mins = elapsedMinutes(session.openedAt)
    const isCompleted = session.paymentStatus === 'Completed'
    const isPending = session.paymentStatus === 'Pending'

    return (
        <div
            onClick={() => onClick(session.sessionId)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                background: highlight ? '#ffe66d' : '#fff9e6',
                borderRadius: '12px 4px 12px 4px / 4px 12px 4px 12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: highlight ? '2px solid #323232' : '2px solid #323232',
                boxShadow: hovered
                    ? '6px 6px 0 #323232'
                    : highlight
                        ? '5px 5px 0 #323232'
                        : '3px 3px 0 #323232',
                cursor: 'pointer',
                opacity: isCompleted ? 0.55 : 1,
                transition: 'box-shadow 0.15s, transform 0.15s',
                transform: hovered ? 'translate(-2px, -2px)' : 'none',
                fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px)',
            }}
        >
            {highlight && (
                <span style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '10px', height: '10px',
                    borderRadius: '50%', background: '#ff6b6b',
                    border: '2px solid #323232',
                    animation: 'cp-ping 1s infinite',
                }} />
            )}

            {isPending && !highlight && (
                <div style={{
                    position: 'absolute', top: '-2px', left: '12px', right: '12px',
                    height: '4px', background: '#ffe66d',
                    border: '1px solid #323232',
                    borderRadius: '0 0 4px 4px',
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '32px', fontWeight: 900,
                        color: '#323232', letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}>{session.tableNumber}</span>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666', fontStyle: 'italic', fontFamily: 'inherit' }}>
                        {formatTime(session.openedAt)} · {mins}dk
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    <PaymentBadge status={session.paymentStatus} />
                    <MethodBadge method={session.paymentMethod} />
                </div>
            </div>

            <div style={{
                display: 'flex', alignItems: 'center',
                borderTop: '2px dashed #32323230',
                paddingTop: '12px', gap: '16px',
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>Sipariş</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#323232', fontFamily: 'inherit' }}>{session.orderCount}</p>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>Toplam</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#5F7154', fontFamily: 'inherit' }}>
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
        <>
            <style>{`
                .cp-page {
                    min-height: 100vh;
                    background: #FFF5F7;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    display: flex;
                    flex-direction: column;
                }
                .cp-header {
                    position: sticky; top: 0; z-index: 10;
                    background: rgba(255,249,230,0.95);
                    backdrop-filter: blur(8px);
                    border-bottom: 2px solid #323232;
                    padding: 14px 24px;
                    display: flex; align-items: center; justify-content: space-between;
                    box-shadow: 0 3px 0 #32323215;
                }
                .cp-brand {
                    display: flex; align-items: center; gap: 12px;
                }
                .cp-brand-icon {
                    width: 40px; height: 40px;
                    background: #ffe66d;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    box-shadow: 3px 3px 0 #323232;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px;
                }
                .cp-brand-title {
                    margin: 0; font-size: 18px; font-weight: 900;
                    color: #323232; text-transform: uppercase;
                    letter-spacing: 0.5px; transform: rotate(-1deg);
                    display: inline-block;
                }
                .cp-brand-sub {
                    margin: 2px 0 0; font-size: 11px; color: #888;
                    font-style: italic;
                }
                .cp-live-pill {
                    display: flex; align-items: center; gap: 6px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 20px;
                    padding: 6px 14px;
                    box-shadow: 3px 3px 0 #323232;
                }
                .cp-live-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%; background: #4ecdc4;
                    border: 1.5px solid #323232;
                    display: inline-block;
                    animation: cp-pulse 2s infinite;
                }
                .cp-live-text {
                    font-size: 11px; font-weight: 700;
                    color: #323232; text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .cp-main {
                    flex: 1; padding: 24px;
                    display: flex; flex-direction: column; gap: 28px;
                }
                .cp-section-title {
                    display: flex; align-items: center; gap: 8px;
                    margin: 0 0 14px;
                    font-size: 11px; font-weight: 700; color: #888;
                    text-transform: uppercase; letter-spacing: 0.1em;
                }
                .cp-section-dot {
                    width: 9px; height: 9px;
                    border-radius: 50%;
                    border: 2px solid #323232;
                    display: inline-block;
                }
                .cp-empty {
                    padding: 48px 20px;
                    border: 2px dashed #ccc;
                    border-radius: 16px; text-align: center;
                    color: #aaa; font-size: 14px; font-weight: 700;
                    background: #fffdf5;
                }
                .cp-error {
                    background: #ffecec;
                    border: 2px solid #ff6b6b;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    padding: 12px 16px;
                    font-size: 13px; color: #c0392b; font-weight: 700;
                    box-shadow: 3px 3px 0 #ff6b6b;
                }
                .cp-loading {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    height: 200px; gap: 12px;
                }
                .cp-loading-emoji {
                    font-size: 36px;
                    animation: cp-bounce 1s ease-in-out infinite;
                }
                .cp-loading-text {
                    font-size: 14px; color: #888; font-weight: 700; font-style: italic;
                }
                @keyframes cp-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes cp-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes cp-ping {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>

            <div className="cp-page">
                <header className="cp-header">
                    <div className="cp-brand">
                        <div className="cp-brand-icon">🧾</div>
                        <div>
                            <p className="cp-brand-title">Kasiyer Paneli</p>
                            <p className="cp-brand-sub">
                                {active.length} aktif masa · {pending.length} ödeme bekliyor
                            </p>
                        </div>
                    </div>
                    <div className="cp-live-pill">
                        <span className="cp-live-dot" />
                        <span className="cp-live-text">Canlı</span>
                    </div>
                </header>

                <main className="cp-main">
                    {loading && (
                        <div className="cp-loading">
                            <span className="cp-loading-emoji">☕</span>
                            <p className="cp-loading-text">Yükleniyor…</p>
                        </div>
                    )}

                    {error && (
                        <div className="cp-error">⚠️ {error}</div>
                    )}

                    {!loading && (
                        <>
                            {pending.length > 0 && (
                                <section>
                                    <div className="cp-section-title">
                                        <span className="cp-section-dot" style={{ background: '#ffe66d' }} />
                                        Ödeme Bekleyen · {pending.length}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
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
                                <div className="cp-section-title">
                                    <span className="cp-section-dot" style={{ background: '#4ecdc4' }} />
                                    Aktif Masalar · {waiting.length}
                                </div>
                                {waiting.length === 0 ? (
                                    <div className="cp-empty">
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍃</div>
                                        Aktif masa yok
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
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
            </div>
        </>
    )
}