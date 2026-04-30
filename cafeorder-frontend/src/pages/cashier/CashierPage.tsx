import { useState, useEffect, useCallback } from 'react'
import { cashierApi } from '../../api/cashier.api'
import { useCashierHub } from '../../hooks/useCashierHub'
import type { CashierSessionDto, PaymentStatus, PaymentMethod } from '../../types/index'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const elapsedMinutes = (iso: string) => {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
}

// ─── PaymentBadge ─────────────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<
    PaymentStatus,
    { label: string; cls: string }
> = {
    None: { label: 'Bekliyor', cls: 'bg-zinc-700 text-zinc-300' },
    Pending: { label: 'Ödeme Talep', cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' },
    Completed: { label: 'Ödendi', cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' },
    Failed: { label: 'Başarısız', cls: 'bg-red-500/20 text-red-300 border border-red-500/40' },
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
    const cfg = PAYMENT_STATUS_CONFIG[status]
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
            {cfg.label}
        </span>
    )
}

function MethodBadge({ method }: { method: PaymentMethod | null }) {
    if (!method || method === 'None') return null
    return (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
            {method === 'Cashier' ? 'Kasa' : 'Online'}
        </span>
    )
}

// ─── SessionCard ──────────────────────────────────────────────────────────────

function SessionCard({
    session,
    highlight,
    onConfirm,
    confirmingId,
}: {
    session: CashierSessionDto
    highlight: boolean
    onConfirm: (sessionId: string) => void
    confirmingId: string | null
}) {
    const mins = elapsedMinutes(session.openedAt)
    const isPending = session.paymentStatus === 'Pending'
    const isCompleted = session.paymentStatus === 'Completed'
    const isConfirming = confirmingId === session.sessionId

    return (
        <div
            className={`
        relative bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3 border transition-all duration-300
        ${highlight ? 'border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.15)]' : 'border-zinc-800'}
        ${isCompleted ? 'opacity-50' : ''}
      `}
        >
            {/* Ping indicator for pending */}
            {highlight && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                </span>
            )}

            {/* Header */}
            <div className="flex items-start justify-between pr-5">
                <div>
                    <span className="font-mono text-2xl font-bold text-white leading-none">
                        {session.tableNumber}
                    </span>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {formatTime(session.openedAt)} · {mins}dk
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <PaymentBadge status={session.paymentStatus} />
                    <MethodBadge method={session.paymentMethod} />
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm border-t border-zinc-800 pt-3">
                <div>
                    <p className="text-zinc-500 text-xs">Sipariş</p>
                    <p className="text-white font-semibold">{session.orderCount}</p>
                </div>
                <div className="flex-1 text-right">
                    <p className="text-zinc-500 text-xs">Toplam</p>
                    <p className="text-white font-bold text-base">{formatCurrency(session.totalAmount)}</p>
                </div>
            </div>

            {/* Confirm button — only for pending cashier payments */}
            {isPending && session.paymentMethod === 'Cashier' && (
                <button
                    disabled={isConfirming}
                    onClick={() => onConfirm(session.sessionId)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60
            text-white text-sm font-semibold transition-all duration-150 active:scale-95"
                >
                    {isConfirming ? 'İşleniyor…' : 'Ödemeyi Onayla'}
                </button>
            )}
        </div>
    )
}

// ─── CashierPage ──────────────────────────────────────────────────────────────

export default function CashierPage() {
    const [sessions, setSessions] = useState<CashierSessionDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [highlightedTables, setHighlightedTables] = useState<Set<number>>(new Set())
    const [confirmingId, setConfirmingId] = useState<string | null>(null)
    const [, setTick] = useState(0)

    // Re-render every minute so elapsed times update
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 60_000)
        return () => clearInterval(id)
    }, [])

    // ── Fetch ─────────────────────────────────────────────────────────────────
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
        // State güncelleyen çağrıyı bir asenkron fonksiyon içine alarak cascading render uyarısını önlüyoruz
        const initFetch = async () => {
            await fetchSessions()
        }

        initFetch()
    }, [fetchSessions]) // fetchSessions zaten useCallback ile sarıldığı için güvenle eklenebilir
    // ── SignalR ───────────────────────────────────────────────────────────────
    const handleTableWaiting = useCallback(
        ({ tableNumber }: { tableNumber: number; totalAmount: number }) => {
            setHighlightedTables((prev) => new Set(prev).add(tableNumber))
            // Re-fetch to get updated paymentStatus
            fetchSessions()
        },
        [fetchSessions],
    )

    const handleSessionClosed = useCallback(
        (tableNumber: number) => {
            setHighlightedTables((prev) => {
                const next = new Set(prev)
                next.delete(tableNumber)
                return next
            })
            fetchSessions()
        },
        [fetchSessions],
    )

    useCashierHub({
        onTableWaitingForPayment: handleTableWaiting,
        onTableSessionClosed: handleSessionClosed,
    })

    // ── Confirm payment ───────────────────────────────────────────────────────
    const handleConfirm = useCallback(async (sessionId: string) => {
        setConfirmingId(sessionId)
        try {
            await cashierApi.confirmPayment(sessionId)
            await fetchSessions()
        } catch {
            setError('Ödeme onaylanamadı.')
        } finally {
            setConfirmingId(null)
        }
    }, [fetchSessions])

    // ── Derived ───────────────────────────────────────────────────────────────
    const active = sessions.filter((s) => s.paymentStatus !== 'Completed')
    const pending = active.filter((s) => s.paymentStatus === 'Pending')
    const waiting = active.filter((s) => s.paymentStatus === 'None')

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-base tracking-tight">Kasiyer Paneli</h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {active.length} aktif masa · {pending.length} ödeme bekliyor
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-zinc-400">Canlı</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 flex flex-col gap-6">
                {loading && (
                    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                        Yükleniyor…
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {!loading && (
                    <>
                        {/* Pending payment section */}
                        {pending.length > 0 && (
                            <section className="flex flex-col gap-3">
                                <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-widest px-1">
                                    Ödeme Bekleyen · {pending.length}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {pending.map((s) => (
                                        <SessionCard
                                            key={s.sessionId}
                                            session={s}
                                            highlight={highlightedTables.has(s.tableNumber)}
                                            onConfirm={handleConfirm}
                                            confirmingId={confirmingId}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Active tables section */}
                        <section className="flex flex-col gap-3">
                            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">
                                Aktif Masalar · {waiting.length}
                            </h2>
                            {waiting.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-zinc-600 text-sm">
                                    Aktif masa yok
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {waiting
                                        .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())
                                        .map((s) => (
                                            <SessionCard
                                                key={s.sessionId}
                                                session={s}
                                                highlight={highlightedTables.has(s.tableNumber)}
                                                onConfirm={handleConfirm}
                                                confirmingId={confirmingId}
                                            />
                                        ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    )
}