// src/components/cashier/SessionDetailCard.tsx
import { useState } from 'react'
import type { CashierSessionDetailDto, CashierOrderRoundDto } from '../../types/index'

// ─── Yardımcı Sabitler ────────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    None: { label: 'Ödeme Yok', className: 'bg-gray-100 text-gray-600' },
    Pending: { label: 'Ödeme Bekliyor', className: 'bg-yellow-100 text-yellow-700' },
    Completed: { label: 'Ödendi', className: 'bg-green-100 text-green-700' },
    Failed: { label: 'Başarısız', className: 'bg-red-100 text-red-700' },
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    None: '—',
    Cashier: 'Kasa',
    Online: 'Online (İyzico)',
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    Received: { label: 'Alındı', className: 'bg-yellow-100 text-yellow-700' },
    BeingPrepared: { label: 'Hazırlanıyor', className: 'bg-blue-100 text-blue-700' },
    Ready: { label: 'Hazır', className: 'bg-green-100 text-green-700' },
}

// ─── Alt Bileşen: Sipariş Turu Satırı ────────────────────────────────────────

interface OrderRoundRowProps {
    round: CashierOrderRoundDto
    index: number
}

function OrderRoundRow({ round, index }: OrderRoundRowProps) {
    const [open, setOpen] = useState(false)

    const statusCfg = ORDER_STATUS_CONFIG[round.status] ?? {
        label: round.status,
        className: 'bg-gray-100 text-gray-600',
    }

    const time = new Date(round.createdAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Tur Başlığı — tıklanabilir */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-5">#{index + 1}</span>
                    <span className="text-sm text-gray-500">{time}</span>
                    <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.className}`}
                    >
                        {statusCfg.label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-600">
                        ₺{round.roundTotal.toFixed(2)}
                    </span>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Ürün Listesi */}
            {open && (
                <div className="px-4 py-3 flex flex-col gap-2 border-t border-gray-100">
                    {round.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 font-medium">
                                    {item.quantity}x {item.productName}
                                </p>
                                {item.modifierSnapshots.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {item.modifierSnapshots.join(', ')}
                                    </p>
                                )}
                            </div>
                            <p className="text-sm font-semibold text-gray-600 ml-3 shrink-0">
                                ₺{item.itemTotal.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

interface SessionDetailCardProps {
    session: CashierSessionDetailDto
    /** "Ödemeyi Onayla" butonuna tıklandığında çalışır */
    onConfirmPayment: (sessionId: string) => void
    /** "Kapat / Geri" butonuna tıklandığında çalışır */
    onClose: () => void
    /** Onay işlemi sürerken butonu disable etmek için */
    isConfirming?: boolean
}

export default function SessionDetailCard({
    session,
    onConfirmPayment,
    onClose,
    isConfirming = false,
}: SessionDetailCardProps) {
    const statusCfg =
        PAYMENT_STATUS_CONFIG[session.paymentStatus] ?? PAYMENT_STATUS_CONFIG.None

    const openedAt = new Date(session.openedAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    const isAlreadyPaid = session.paymentStatus === 'Completed'
    const canConfirm = session.paymentStatus === 'Pending' && !isAlreadyPaid

    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                        🪑
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">
                            Masa {session.tableNumber}
                        </h2>
                        <p className="text-purple-200 text-xs">Açılış: {openedAt}</p>
                    </div>
                </div>

                <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${session.paymentStatus === 'Pending'
                            ? 'bg-yellow-400/20 border-yellow-300/40 text-yellow-200'
                            : session.paymentStatus === 'Completed'
                                ? 'bg-green-400/20 border-green-300/40 text-green-200'
                                : 'bg-white/15 border-white/25 text-white'
                        }`}
                >
                    {statusCfg.label}
                </span>
            </div>

            {/* ── Özet Bilgiler ────────────────────────────────────────────── */}
            <div className="px-5 py-4 flex flex-col gap-3">
                {/* Genel Toplam */}
                <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-base">💰</span>
                        <span className="text-sm text-gray-600 font-medium">Genel Toplam</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                        ₺{session.grandTotal.toFixed(2)}
                    </span>
                </div>

                {/* Ödeme Yöntemi */}
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-base">💳</span>
                        <span className="text-sm text-gray-600 font-medium">Ödeme Yöntemi</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                        {PAYMENT_METHOD_LABEL[session.paymentMethod ?? 'None'] ?? '—'}
                    </span>
                </div>

                {/* Sipariş Turu Sayısı */}
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-base">📦</span>
                        <span className="text-sm text-gray-600 font-medium">Sipariş Turu</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                        {session.orderRounds.length} tur
                    </span>
                </div>
            </div>

            {/* ── Sipariş Detayları ────────────────────────────────────────── */}
            {session.orderRounds.length > 0 && (
                <div className="px-5 pb-4 flex flex-col gap-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Sipariş Detayı
                    </p>
                    {session.orderRounds.map((round, i) => (
                        <OrderRoundRow key={round.orderId} round={round} index={i} />
                    ))}
                </div>
            )}

            {/* ── Footer Aksiyonlar ────────────────────────────────────────── */}
            <div className="px-5 pb-5 pt-2 flex gap-3 mt-auto">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Geri
                </button>

                {canConfirm && (
                    <button
                        onClick={() => onConfirmPayment(session.sessionId)}
                        disabled={isConfirming}
                        className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-semibold text-white transition-colors"
                    >
                        {isConfirming ? 'Onaylanıyor...' : 'Ödemeyi Onayla'}
                    </button>
                )}

                {isAlreadyPaid && (
                    <div className="flex-1 py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-600 text-center flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Ödendi
                    </div>
                )}
            </div>
        </div>
    )
}