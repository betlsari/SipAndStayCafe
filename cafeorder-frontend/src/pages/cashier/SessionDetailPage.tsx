// src/pages/cashier/SessionDetailPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cashierApi } from '../../api/cashier.api'
import type { CashierSessionDetailDto, PaymentStatus, } from '../../types/index'

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string }> = {
    None: { label: 'Bekliyor', cls: 'bg-zinc-700 text-zinc-300' },
    Pending: { label: 'Ödeme Talep', cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' },
    Completed: { label: 'Ödendi', cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' },
    Failed: { label: 'Başarısız', cls: 'bg-red-500/20 text-red-300 border border-red-500/40' },
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    Received: { label: 'Alındı', cls: 'text-amber-400 bg-amber-400/10' },
    BeingPrepared: { label: 'Hazırlanıyor', cls: 'text-blue-400 bg-blue-400/10' },
    Ready: { label: 'Hazır ✓', cls: 'text-emerald-400 bg-emerald-400/10' },
}

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [session, setSession] = useState<CashierSessionDetailDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [confirming, setConfirming] = useState(false)

    const fetchDetail = useCallback(async () => {
        if (!id) return
        try {
            const res = await cashierApi.getSessionDetail(id)
            setSession(res.data)
        } catch {
            setError('Oturum detayı yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        const fetch = async () => {
            await fetchDetail()
        }
        fetch()
    }, [fetchDetail])

    const handleConfirm = async () => {
        if (!id) return
        setConfirming(true)
        setError(null)
        try {
            await cashierApi.confirmPayment(id)
            await fetchDetail()
        } catch (err: unknown) {
            // Backend'den gelen hata mesajını göster
            const axiosErr = err as { response?: { data?: { error?: string; message?: string } } }
            const backendMsg = axiosErr?.response?.data?.error ?? axiosErr?.response?.data?.message
            if (backendMsg?.includes('NotReady') || backendMsg?.includes('hazırlanmamış')) {
                setError('Tüm siparişler "Hazır" durumuna geçmeden ödeme onaylanamaz.')
            } else {
                setError(backendMsg ?? 'Ödeme onaylanamadı.')
            }
        } finally {
            setConfirming(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
            Yükleniyor…
        </div>
    )

    if (error && !session) return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 p-6">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => navigate(-1)} className="text-zinc-400 text-sm underline">Geri Dön</button>
        </div>
    )

    if (!session) return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 p-6">
            <p className="text-red-400 text-sm">Bulunamadı.</p>
            <button onClick={() => navigate(-1)} className="text-zinc-400 text-sm underline">Geri Dön</button>
        </div>
    )

    const statusCfg = PAYMENT_STATUS_CONFIG[session.paymentStatus]
    const canConfirm = session.paymentStatus !== 'Completed' && session.paymentStatus !== 'Failed'

    // Hazır olmayan siparişler var mı?
    const notReadyOrders = session.orderRounds.filter(r => r.status !== 'Ready')
    const allOrdersReady = notReadyOrders.length === 0 && session.orderRounds.length > 0
    const confirmBlocked = !allOrdersReady

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="text-zinc-400 hover:text-white transition-colors p-1 -ml-1"
                    aria-label="Geri"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1">
                    <h1 className="font-bold text-base tracking-tight">Masa {session.tableNumber}</h1>
                    <p className="text-xs text-zinc-500">{formatDateTime(session.openedAt)}'den beri açık</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.cls}`}>
                    {statusCfg.label}
                </span>
            </header>

            <main className="flex-1 p-4 flex flex-col gap-4">
                {/* Summary card */}
                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-zinc-500 mb-0.5">Genel Toplam</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(session.grandTotal)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-0.5">Ödeme Yöntemi</p>
                        <p className="text-sm font-medium text-zinc-200">
                            {!session.paymentMethod || session.paymentMethod === 'None'
                                ? '—'
                                : session.paymentMethod === 'Cashier' ? 'Kasa' : 'Online'}
                        </p>
                    </div>
                </div>

                {/* Not ready warning */}
                {canConfirm && confirmBlocked && session.orderRounds.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                        <span className="text-amber-400 text-lg shrink-0">⚠️</span>
                        <div>
                            <p className="text-amber-300 text-sm font-semibold">Hazırlanmamış sipariş var</p>
                            <p className="text-amber-400/70 text-xs mt-0.5">
                                {notReadyOrders.length} sipariş turu henüz "Hazır" durumuna geçmedi. Tüm siparişler hazır olmadan ödeme onaylanamaz.
                            </p>
                        </div>
                    </div>
                )}

                {/* Confirm button */}
                {canConfirm && (
                    <button
                        disabled={confirming || confirmBlocked}
                        onClick={handleConfirm}
                        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95
                            ${confirmBlocked
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                            } disabled:opacity-60`}
                    >
                        {confirming
                            ? 'İşleniyor…'
                            : confirmBlocked
                                ? '🔒 Siparişler Hazır Değil'
                                : '✓ Ödemeyi Onayla ve Masayı Kapat'}
                    </button>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                )}

                {/* Order rounds */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">
                        Sipariş Geçmişi · {session.orderRounds.length}
                    </h2>

                    {session.orderRounds.length === 0 && (
                        <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-zinc-600 text-sm">
                            Sipariş yok
                        </div>
                    )}

                    {session.orderRounds.map((round, idx) => {
                        const orderStatus = ORDER_STATUS_CONFIG[round.status] ?? ORDER_STATUS_CONFIG.Received
                        return (
                            <div key={round.orderId} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                                {/* Round header */}
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-zinc-500">#{session.orderRounds.length - idx}. Tur</span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${orderStatus.cls}`}>
                                            {orderStatus.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-zinc-500">{formatDateTime(round.createdAt)}</span>
                                        <span className="text-sm font-bold text-white">{formatCurrency(round.roundTotal)}</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <ul className="px-4 py-3 flex flex-col gap-2">
                                    {round.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="text-sm font-bold text-zinc-400 w-6 shrink-0">{item.quantity}×</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-zinc-100">{item.productName}</p>
                                                {item.modifierSnapshots.length > 0 && (
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {item.modifierSnapshots.join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-sm text-zinc-300 shrink-0">{formatCurrency(item.itemTotal)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </section>
            </main>
        </div>
    )
}