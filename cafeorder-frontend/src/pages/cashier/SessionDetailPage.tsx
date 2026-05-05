import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cashierApi } from '../../api/cashier.api'
import type { CashierSessionDetailDto, PaymentStatus } from '../../types/index'


<style>{`
    .sd-page {
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
    .sd-header {
        position: sticky; top: 0; z-index: 10;
        background: rgba(255,249,230,0.95);
        backdrop-filter: blur(8px);
        border-bottom: 2px solid #323232;
        padding: 14px 20px;
        display: flex; align-items: center; gap: 12px;
        box-shadow: 0 3px 0 #32323215;
    }
    .sd-back-btn {
        width: 36px; height: 36px;
        background: #ffe66d;
        border: 2px solid #323232;
        border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: #323232; font-size: 16px; font-weight: 900;
        box-shadow: 3px 3px 0 #323232;
        transition: all 0.15s;
        font-family: inherit;
    }
    .sd-back-btn:hover {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #323232;
    }
    .sd-header-title {
        margin: 0; font-size: 17px; font-weight: 900;
        color: #323232; text-transform: uppercase;
        letter-spacing: 0.5px; transform: rotate(-1deg);
        display: inline-block;
    }
    .sd-header-sub {
        margin: 2px 0 0; font-size: 11px; color: #888; font-style: italic;
    }
    .sd-status-badge {
        font-size: 11px; font-weight: 700;
        padding: 4px 12px; border-radius: 20px;
        border: 2px solid #323232;
        box-shadow: 2px 2px 0 #323232;
        font-family: inherit;
        text-transform: uppercase; letter-spacing: 0.05em;
    }
    .sd-main {
        flex: 1; padding: 20px;
        display: flex; flex-direction: column; gap: 16px;
    }
    .sd-summary-card {
        background: #fff9e6;
        border: 2px solid #323232;
        border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
        padding: 18px;
        display: flex; align-items: center; justify-content: space-between;
        box-shadow: 4px 4px 0 #323232;
        background-image: repeating-linear-gradient(
            transparent, transparent 27px,
            rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
        );
    }
    .sd-summary-label {
        margin: 0; font-size: 11px; color: #888;
        text-transform: uppercase; letter-spacing: 0.06em;
    }
    .sd-summary-value {
        margin: 4px 0 0; font-size: 30px; font-weight: 900;
        color: #323232; letter-spacing: -0.02em;
    }
    .sd-summary-method {
        margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #323232;
    }
    .sd-warning {
        background: #fff9e6;
        border: 2px solid #323232;
        border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
        padding: 14px 16px;
        display: flex; align-items: flex-start; gap: 10px;
        box-shadow: 3px 3px 0 #323232;
    }
    .sd-warning-title {
        margin: 0; font-size: 13px; font-weight: 700; color: #323232;
    }
    .sd-warning-desc {
        margin: 4px 0 0; font-size: 12px; color: #666; line-height: 1.5;
    }
    .sd-confirm-btn {
        width: 100%; padding: 14px;
        border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
        border: 2px solid #323232;
        font-size: 14px; font-weight: 900;
        cursor: pointer; font-family: inherit;
        transition: all 0.15s;
        text-transform: uppercase; letter-spacing: 0.5px;
        box-shadow: 4px 4px 0 #323232;
    }
    .sd-confirm-btn.active {
        background: #ffe66d; color: #323232;
    }
    .sd-confirm-btn.active:hover:not(:disabled) {
        transform: translate(-1px, -1px);
        box-shadow: 5px 5px 0 #323232;
        background: #ffd700;
    }
    .sd-confirm-btn.blocked {
        background: #f0ece4; color: #aaa;
        cursor: not-allowed;
    }
    .sd-confirm-btn:disabled { opacity: 0.7; }
    .sd-error {
        background: #ffecec;
        border: 2px solid #ff6b6b;
        border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
        padding: 12px 16px;
        font-size: 13px; color: #c0392b; font-weight: 700;
        text-align: center;
        box-shadow: 3px 3px 0 #ff6b6b;
    }
    .sd-section-title {
        margin: 0; font-size: 11px; font-weight: 700; color: #888;
        text-transform: uppercase; letter-spacing: 0.1em;
    }
    .sd-round-card {
        background: #fff9e6;
        border: 2px solid #323232;
        border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
        overflow: hidden;
        box-shadow: 3px 3px 0 #323232;
    }
    .sd-round-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 16px;
        border-bottom: 2px dashed #32323230;
        background: #fffdf5;
    }
    .sd-round-label {
        font-size: 12px; color: #888; font-family: monospace;
    }
    .sd-round-status {
        font-size: 10px; font-weight: 700;
        padding: 2px 9px; border-radius: 20px;
        border: 2px solid #323232;
        box-shadow: 1px 1px 0 #323232;
        font-family: inherit;
        text-transform: uppercase;
    }
    .sd-round-time {
        font-size: 11px; color: #888; font-style: italic;
    }
    .sd-round-total {
        font-size: 15px; font-weight: 900; color: #323232;
    }
    .sd-items-list {
        margin: 0; padding: 14px 16px;
        list-style: none;
        display: flex; flex-direction: column; gap: 10px;
    }
    .sd-item-row {
        display: flex; align-items: flex-start; gap: 12px;
    }
    .sd-item-qty {
        font-size: 13px; font-weight: 900; color: #5F7154;
        width: 24px; flex-shrink: 0;
    }
    .sd-item-name {
        margin: 0; font-size: 13px; color: #323232; font-weight: 600;
    }
    .sd-item-mods {
        margin: 2px 0 0; font-size: 11px; color: #888; font-style: italic;
    }
    .sd-item-total {
        font-size: 13px; font-weight: 700; color: #323232; flex-shrink: 0;
    }
    .sd-empty-rounds {
        padding: 40px 20px;
        border: 2px dashed #ccc;
        border-radius: 14px; text-align: center;
        color: #aaa; font-size: 14px; font-weight: 700;
        background: #fffdf5;
    }
    .sd-loading {
        min-height: 100vh; background: #FFF5F7;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 12px;
        font-family: "Comic Sans MS", "Chalkboard SE", cursive;
    }
    .sd-loading-emoji {
        font-size: 32px;
        animation: sd-bounce 1s ease-in-out infinite;
    }
    .sd-loading-text {
        font-size: 14px; color: #888; font-weight: 700; font-style: italic;
    }
    @keyframes sd-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
`}</style>

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

    // Loading state
    if (loading) return (
        <div className="sd-loading">
            <span className="sd-loading-emoji">☕</span>
            <p className="sd-loading-text">Yükleniyor…</p>
        </div>
    )

    if (!session) return (
        <div className="sd-loading">
            <p style={{ color: '#c0392b', fontSize: '14px', fontWeight: 700 }}>{error ?? 'Bulunamadı.'}</p>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5F7154', textDecoration: 'underline', fontSize: '14px', fontFamily: '"Comic Sans MS", cursive' }}>Geri Dön</button>
        </div>
    )

    const statusCfg = PAYMENT_STATUS_CONFIG[session.paymentStatus]
    const canConfirm = session.paymentStatus !== 'Completed' && session.paymentStatus !== 'Failed'
    const notReadyOrders = session.orderRounds.filter(r => r.status !== 'Ready')
    const confirmBlocked = notReadyOrders.length > 0 || session.orderRounds.length === 0

    return (
        <>
            <style>{`
            .sd-page {
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
            .sd-header {
                position: sticky; top: 0; z-index: 10;
                background: rgba(255,249,230,0.95);
                backdrop-filter: blur(8px);
                border-bottom: 2px solid #323232;
                padding: 14px 20px;
                display: flex; align-items: center; gap: 12px;
                box-shadow: 0 3px 0 #32323215;
            }
            .sd-back-btn {
                width: 36px; height: 36px;
                background: #ffe66d;
                border: 2px solid #323232;
                border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                color: #323232; font-size: 16px; font-weight: 900;
                box-shadow: 3px 3px 0 #323232;
                transition: all 0.15s;
                font-family: inherit;
            }
            .sd-back-btn:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #323232; }
            .sd-header-title {
                margin: 0; font-size: 17px; font-weight: 900;
                color: #323232; text-transform: uppercase;
                letter-spacing: 0.5px; transform: rotate(-1deg); display: inline-block;
            }
            .sd-header-sub { margin: 2px 0 0; font-size: 11px; color: #888; font-style: italic; }
            .sd-status-badge {
                font-size: 11px; font-weight: 700;
                padding: 4px 12px; border-radius: 20px;
                border: 2px solid #323232;
                box-shadow: 2px 2px 0 #323232;
                font-family: inherit;
                text-transform: uppercase; letter-spacing: 0.05em;
            }
            .sd-main { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
            .sd-summary-card {
                background: #fff9e6;
                border: 2px solid #323232;
                border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                padding: 18px;
                display: flex; align-items: center; justify-content: space-between;
                box-shadow: 4px 4px 0 #323232;
                background-image: repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px);
            }
            .sd-summary-label { margin: 0; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
            .sd-summary-value { margin: 4px 0 0; font-size: 30px; font-weight: 900; color: #323232; letter-spacing: -0.02em; }
            .sd-summary-method { margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #323232; }
            .sd-warning {
                background: #fff9e6; border: 2px solid #323232;
                border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px;
                box-shadow: 3px 3px 0 #323232;
            }
            .sd-warning-title { margin: 0; font-size: 13px; font-weight: 700; color: #323232; }
            .sd-warning-desc { margin: 4px 0 0; font-size: 12px; color: #666; line-height: 1.5; }
            .sd-confirm-btn {
                width: 100%; padding: 14px;
                border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                border: 2px solid #323232;
                font-size: 14px; font-weight: 900;
                cursor: pointer; font-family: inherit;
                transition: all 0.15s; text-transform: uppercase; letter-spacing: 0.5px;
                box-shadow: 4px 4px 0 #323232;
            }
            .sd-confirm-btn.active { background: #ffe66d; color: #323232; }
            .sd-confirm-btn.active:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 #323232; background: #ffd700; }
            .sd-confirm-btn.blocked { background: #f0ece4; color: #aaa; cursor: not-allowed; }
            .sd-confirm-btn:disabled { opacity: 0.7; }
            .sd-error {
                background: #ffecec; border: 2px solid #ff6b6b;
                border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                padding: 12px 16px; font-size: 13px; color: #c0392b; font-weight: 700;
                text-align: center; box-shadow: 3px 3px 0 #ff6b6b;
            }
            .sd-section-title { margin: 0; font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
            .sd-round-card {
                background: #fff9e6; border: 2px solid #323232;
                border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                overflow: hidden; box-shadow: 3px 3px 0 #323232;
            }
            .sd-round-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 10px 16px; border-bottom: 2px dashed #32323230; background: #fffdf5;
            }
            .sd-round-label { font-size: 12px; color: #888; font-family: monospace; }
            .sd-round-status {
                font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
                border: 2px solid #323232; box-shadow: 1px 1px 0 #323232;
                font-family: inherit; text-transform: uppercase;
            }
            .sd-round-time { font-size: 11px; color: #888; font-style: italic; }
            .sd-round-total { font-size: 15px; font-weight: 900; color: #323232; }
            .sd-items-list { margin: 0; padding: 14px 16px; list-style: none; display: flex; flex-direction: column; gap: 10px; }
            .sd-item-row { display: flex; align-items: flex-start; gap: 12px; }
            .sd-item-qty { font-size: 13px; font-weight: 900; color: #5F7154; width: 24px; flex-shrink: 0; }
            .sd-item-name { margin: 0; font-size: 13px; color: #323232; font-weight: 600; }
            .sd-item-mods { margin: 2px 0 0; font-size: 11px; color: #888; font-style: italic; }
            .sd-item-total { font-size: 13px; font-weight: 700; color: #323232; flex-shrink: 0; }
            .sd-empty-rounds {
                padding: 40px 20px; border: 2px dashed #ccc; border-radius: 14px;
                text-align: center; color: #aaa; font-size: 14px; font-weight: 700; background: #fffdf5;
            }
            .sd-loading {
                min-height: 100vh; background: #FFF5F7;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 12px; font-family: "Comic Sans MS", "Chalkboard SE", cursive;
            }
            .sd-loading-emoji { font-size: 32px; animation: sd-bounce 1s ease-in-out infinite; }
            .sd-loading-text { font-size: 14px; color: #888; font-weight: 700; font-style: italic; }
            @keyframes sd-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `}</style>

            <div className="sd-page">
                <header className="sd-header">
                    <button className="sd-back-btn" onClick={() => navigate(-1)}>←</button>
                    <div style={{ flex: 1 }}>
                        <p className="sd-header-title">Masa {session.tableNumber}</p>
                        <p className="sd-header-sub">{formatDateTime(session.openedAt)}'den beri açık</p>
                    </div>
                    <span
                        className="sd-status-badge"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                        {statusCfg.label}
                    </span>
                </header>

                <main className="sd-main">
                    <div className="sd-summary-card">
                        <div>
                            <p className="sd-summary-label">Genel Toplam</p>
                            <p className="sd-summary-value">{formatCurrency(session.grandTotal)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="sd-summary-label">Ödeme Yöntemi</p>
                            <p className="sd-summary-method">
                                {!session.paymentMethod || session.paymentMethod === 'None'
                                    ? '—'
                                    : session.paymentMethod === 'Cashier' ? '🧾 Kasa' : '💳 Online'}
                            </p>
                        </div>
                    </div>

                    {canConfirm && confirmBlocked && session.orderRounds.length > 0 && (
                        <div className="sd-warning">
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                            <div>
                                <p className="sd-warning-title">Hazırlanmamış sipariş var</p>
                                <p className="sd-warning-desc">
                                    {notReadyOrders.length} sipariş turu henüz hazır değil. Tüm siparişler hazır olmadan ödeme onaylanamaz.
                                </p>
                            </div>
                        </div>
                    )}

                    {canConfirm && (
                        <button
                            disabled={confirming || confirmBlocked}
                            onClick={handleConfirm}
                            className={`sd-confirm-btn ${confirmBlocked ? 'blocked' : 'active'}`}
                        >
                            {confirming ? 'İşleniyor…' : confirmBlocked ? '🔒 Siparişler Hazır Değil' : '✓ Ödemeyi Onayla ve Masayı Kapat'}
                        </button>
                    )}

                    {error && <div className="sd-error">{error}</div>}

                    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h2 className="sd-section-title">
                            Sipariş Geçmişi · {session.orderRounds.length}
                        </h2>

                        {session.orderRounds.length === 0 && (
                            <div className="sd-empty-rounds">Sipariş yok</div>
                        )}

                        {session.orderRounds.map((round, idx) => {
                            const orderStatus = ORDER_STATUS_CONFIG[round.status] ?? ORDER_STATUS_CONFIG.Received
                            return (
                                <div key={round.orderId} className="sd-round-card">
                                    <div className="sd-round-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="sd-round-label">
                                                #{session.orderRounds.length - idx}. Tur
                                            </span>
                                            <span
                                                className="sd-round-status"
                                                style={{ background: orderStatus.bg, color: orderStatus.color }}
                                            >
                                                {orderStatus.label}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className="sd-round-time">{formatDateTime(round.createdAt)}</span>
                                            <span className="sd-round-total">{formatCurrency(round.roundTotal)}</span>
                                        </div>
                                    </div>

                                    <ul className="sd-items-list">
                                        {round.items.map((item, i) => (
                                            <li key={i} className="sd-item-row">
                                                <span className="sd-item-qty">{item.quantity}×</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p className="sd-item-name">{item.productName}</p>
                                                    {item.modifierSnapshots.length > 0 && (
                                                        <p className="sd-item-mods">{item.modifierSnapshots.join(' · ')}</p>
                                                    )}
                                                </div>
                                                <span className="sd-item-total">{formatCurrency(item.itemTotal)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        })}
                    </section>
                </main>
            </div>
        </>
    )
};