import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cashierApi } from '../../api/cashier.api'
import type { CashierSessionDetailDto, PaymentStatus } from '../../types/index'

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; color: string; border: string }> = {
    None: { label: 'Bekliyor', bg: '#F0ECE4', color: '#6A6560', border: '#D8D4CC' },
    Pending: { label: 'Ödeme Talep', bg: '#FEF6EE', color: '#A05C1A', border: '#F0C88080' },
    Completed: { label: 'Ödendi', bg: '#EFF5EC', color: '#3D5C34', border: '#82A76B40' },
    Failed: { label: 'Başarısız', bg: '#FEF0EE', color: '#7A3530', border: '#E0907040' },
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    Received: { label: 'Alındı', color: '#A05C1A', bg: '#FEF6EE' },
    BeingPrepared: { label: 'Hazırlanıyor', color: '#2B5FA0', bg: '#EEF4FE' },
    Ready: { label: 'Hazır ✓', color: '#3D5C34', bg: '#EFF5EC' },
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
        const fetch = async () => { await fetchDetail() }
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
        <div style={{
            minHeight: '100vh', background: '#F7F5F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
            fontFamily: 'system-ui, sans-serif',
        }}>
            <div style={{ fontSize: '28px' }}>☕</div>
            <p style={{ color: '#8A8478', fontSize: '14px' }}>Yükleniyor…</p>
        </div>
    )

    if (!session) return (
        <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ color: '#7A3530', fontSize: '14px' }}>{error ?? 'Bulunamadı.'}</p>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5F7154', textDecoration: 'underline', fontSize: '14px', fontFamily: 'inherit' }}>Geri Dön</button>
        </div>
    )

    const statusCfg = PAYMENT_STATUS_CONFIG[session.paymentStatus]
    const canConfirm = session.paymentStatus !== 'Completed' && session.paymentStatus !== 'Failed'
    const notReadyOrders = session.orderRounds.filter(r => r.status !== 'Ready')
    const confirmBlocked = notReadyOrders.length > 0 || session.orderRounds.length === 0

    return (
        <div style={{ minHeight: '100vh', background: '#F7F5F0', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: 'rgba(247,245,240,0.95)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #E0DDD6',
                padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: '12px',
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        width: '34px', height: '34px',
                        background: '#FFFFFF',
                        border: '1px solid #E0DDD6',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#5F7154',
                        fontSize: '16px',
                    }}
                >←</button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2C3528', letterSpacing: '-0.01em' }}>
                        Masa {session.tableNumber}
                    </h1>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8A8478' }}>
                        {formatDateTime(session.openedAt)}'den beri açık
                    </p>
                </div>
                <span style={{
                    fontSize: '12px', fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    background: statusCfg.bg,
                    color: statusCfg.color,
                    border: `1px solid ${statusCfg.border}`,
                }}>{statusCfg.label}</span>
            </header>

            <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Summary */}
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E8E4DC',
                    padding: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(95,113,84,0.05)',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#9A8E80' }}>Genel Toplam</p>
                        <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: '#2C3528', letterSpacing: '-0.02em' }}>
                            {formatCurrency(session.grandTotal)}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#9A8E80' }}>Ödeme Yöntemi</p>
                        <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 500, color: '#4A4840' }}>
                            {!session.paymentMethod || session.paymentMethod === 'None'
                                ? '—'
                                : session.paymentMethod === 'Cashier' ? '🧾 Kasa' : '💳 Online'}
                        </p>
                    </div>
                </div>

                {/* Warning */}
                {canConfirm && confirmBlocked && session.orderRounds.length > 0 && (
                    <div style={{
                        background: '#FEF6EE',
                        border: '1px solid #F0C880',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                    }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                        <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#7A5C1A' }}>Hazırlanmamış sipariş var</p>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9A7040', lineHeight: 1.5 }}>
                                {notReadyOrders.length} sipariş turu henüz hazır değil. Tüm siparişler hazır olmadan ödeme onaylanamaz.
                            </p>
                        </div>
                    </div>
                )}

                {/* Confirm Button */}
                {canConfirm && (
                    <button
                        disabled={confirming || confirmBlocked}
                        onClick={handleConfirm}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '14px',
                            border: 'none',
                            background: confirmBlocked ? '#E8E4DC' : '#5F7154',
                            color: confirmBlocked ? '#9A8E80' : '#FFFFFF',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: confirmBlocked ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            transition: 'background 0.15s',
                            opacity: confirming ? 0.7 : 1,
                        }}
                    >
                        {confirming ? 'İşleniyor…' : confirmBlocked ? '🔒 Siparişler Hazır Değil' : '✓ Ödemeyi Onayla ve Masayı Kapat'}
                    </button>
                )}

                {error && (
                    <div style={{
                        background: '#FEF0EE', border: '1px solid #E0907040',
                        borderRadius: '12px', padding: '12px 16px',
                        fontSize: '14px', color: '#7A3530', textAlign: 'center',
                    }}>{error}</div>
                )}

                {/* Order Rounds */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#8A8478', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                        Sipariş Geçmişi · {session.orderRounds.length}
                    </h2>

                    {session.orderRounds.length === 0 && (
                        <div style={{
                            padding: '40px 20px',
                            border: '1.5px dashed #D8D4CC',
                            borderRadius: '14px',
                            textAlign: 'center',
                            color: '#B0AB9E',
                            fontSize: '14px',
                            background: '#FDFCF9',
                        }}>Sipariş yok</div>
                    )}

                    {session.orderRounds.map((round, idx) => {
                        const orderStatus = ORDER_STATUS_CONFIG[round.status] ?? ORDER_STATUS_CONFIG.Received
                        return (
                            <div key={round.orderId} style={{
                                background: '#FFFFFF',
                                borderRadius: '14px',
                                border: '1px solid #E8E4DC',
                                overflow: 'hidden',
                                boxShadow: '0 1px 4px rgba(95,113,84,0.05)',
                            }}>
                                {/* Round header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 16px',
                                    borderBottom: '1px solid #EDE9E0',
                                    background: '#FDFCF9',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#9A8E80', fontFamily: 'monospace' }}>
                                            #{session.orderRounds.length - idx}. Tur
                                        </span>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 600,
                                            padding: '2px 8px', borderRadius: '20px',
                                            background: orderStatus.bg,
                                            color: orderStatus.color,
                                        }}>{orderStatus.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', color: '#9A8E80' }}>{formatDateTime(round.createdAt)}</span>
                                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#2C3528' }}>{formatCurrency(round.roundTotal)}</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <ul style={{ margin: 0, padding: '14px 16px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {round.items.map((item, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#82A76B', width: '24px', flexShrink: 0 }}>{item.quantity}×</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '14px', color: '#2C3528', fontWeight: 500 }}>{item.productName}</p>
                                                {item.modifierSnapshots.length > 0 && (
                                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9A8E80' }}>
                                                        {item.modifierSnapshots.join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '14px', color: '#4A4840', fontWeight: 500, flexShrink: 0 }}>{formatCurrency(item.itemTotal)}</span>
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