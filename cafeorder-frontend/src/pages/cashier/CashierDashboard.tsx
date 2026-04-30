// src/pages/cashier/CashierDashboard.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { cashierApi } from '../../api/cashier.api'
import { createCashierHubConnection } from '../../api/signalr'
import type { HubConnection } from '@microsoft/signalr'
import type {
    CashierSessionDto,
    CashierSessionDetailDto,
} from '../../types/index'
import SessionDetailCard from '../../components/cashier/SessionDetailCard'
import ConfirmPaymentButton from '../../components/cashier/ConfirmPaymentButton'

// ─── Yardımcı Sabitler ────────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    None: { label: 'Aktif', className: 'bg-gray-100 text-gray-600' },
    Pending: { label: 'Ödeme Bekliyor', className: 'bg-yellow-100 text-yellow-700' },
    Completed: { label: 'Ödendi', className: 'bg-green-100 text-green-700' },
    Failed: { label: 'Başarısız', className: 'bg-red-100 text-red-700' },
}

// ─── Oturum Kartı (Liste Öğesi) ───────────────────────────────────────────────

interface SessionCardProps {
    session: CashierSessionDto
    isPending?: boolean
    onSelect: (session: CashierSessionDto) => void
}

function SessionCard({ session, isPending, onSelect }: SessionCardProps) {
    const statusCfg =
        PAYMENT_STATUS_CONFIG[session.paymentStatus] ?? PAYMENT_STATUS_CONFIG.None

    const openedAt = new Date(session.openedAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <button
            onClick={() => onSelect(session)}
            className={`w-full text-left bg-white rounded-xl shadow-sm p-4 flex items-center justify-between transition-all hover:shadow-md active:scale-[0.99] ${isPending ? 'ring-2 ring-yellow-400' : ''
                }`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${isPending
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                >
                    {session.tableNumber}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">
                        Masa {session.tableNumber}
                    </p>
                    <p className="text-xs text-gray-400">
                        {session.orderCount} tur · Açılış {openedAt}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-purple-600">
                    ₺{session.totalAmount.toFixed(2)}
                </span>
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.className}`}
                >
                    {statusCfg.label}
                </span>
            </div>
        </button>
    )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'pending'

export default function CashierDashboard() {
    const [tab, setTab] = useState<Tab>('all')
    const [sessions, setSessions] = useState<CashierSessionDto[]>([])
    const [pendingSessions, setPendingSessions] = useState<CashierSessionDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedSession, setSelectedSession] = useState<CashierSessionDetailDto | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    const connectionRef = useRef<HubConnection | null>(null)

    // ── Veri Çekme ────────────────────────────────────────────────────────────

    const fetchSessions = useCallback(async () => {
        try {
            const [allRes, pendingRes] = await Promise.all([
                cashierApi.getActiveSessions(),
                cashierApi.getPendingPayments(),
            ])
            setSessions(allRes.data)
            setPendingSessions(pendingRes.data)
            setError(null)
        } catch {
            setError('Oturumlar yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchDetail = async (sessionId: string) => {
        setDetailLoading(true)
        setDetailError(null)
        try {
            const res = await cashierApi.getSessionDetail(sessionId)
            setSelectedSession(res.data)
        } catch {
            setDetailError('Detay yüklenemedi.')
        } finally {
            setDetailLoading(false)
        }
    }

    const handleSelectSession = (session: CashierSessionDto) => {
        fetchDetail(session.sessionId)
    }

    const handleCloseDetail = () => {
        setSelectedSession(null)
        setDetailError(null)
    }

    const handlePaymentConfirmed = () => {
        setSelectedSession(null)
        fetchSessions()
    }

    // ── SignalR ───────────────────────────────────────────────────────────────

    useEffect(() => {
        const connection = createCashierHubConnection()
        connectionRef.current = connection

        connection.on('TableWaitingForPayment', () => {
            fetchSessions()
        })

        connection.on('TableSessionClosed', () => {
            fetchSessions()
            setSelectedSession(null)
        })

        connection.start().catch(() => {
            // Bağlantı hatası sessizce geçilir; polling devam eder
        })

        return () => {
            connection.stop()
        }
    }, [fetchSessions])

    // ── İlk Yükleme ───────────────────────────────────────────────────────────

    useEffect(() => {
        // Schedule fetchSessions to run after the current render
        const id = setTimeout(() => {
            fetchSessions()
        }, 0)
        return () => clearTimeout(id)
    }, [fetchSessions])

    // ── Render ────────────────────────────────────────────────────────────────

    const displayList = tab === 'pending' ? pendingSessions : sessions

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Kasiyer Paneli</h1>
                <button
                    onClick={fetchSessions}
                    className="text-sm text-purple-600 font-semibold hover:underline"
                >
                    Yenile
                </button>
            </div>

            {/* Tab Bar */}
            <div className="bg-white border-b px-4 py-2 flex gap-2">
                <button
                    onClick={() => setTab('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'all'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    Tüm Masalar
                    {sessions.length > 0 && (
                        <span className="ml-1.5 bg-white/30 text-current text-xs px-1.5 py-0.5 rounded-full">
                            {sessions.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab('pending')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors relative ${tab === 'pending'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    Ödeme Bekleyenler
                    {pendingSessions.length > 0 && (
                        <span
                            className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === 'pending'
                                    ? 'bg-white/30 text-white'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                        >
                            {pendingSessions.length}
                        </span>
                    )}
                </button>
            </div>

            {/* İçerik */}
            <div className="flex-1 px-4 py-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-gray-400 text-sm">Yükleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                ) : displayList.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-gray-400 text-sm">
                            {tab === 'pending'
                                ? 'Ödeme bekleyen masa yok.'
                                : 'Aktif masa oturumu yok.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {displayList.map((session) => (
                            <SessionCard
                                key={session.sessionId}
                                session={session}
                                isPending={session.paymentStatus === 'Pending'}
                                onSelect={handleSelectSession}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Panel — Overlay */}
            {(detailLoading || selectedSession || detailError) && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
                    <div className="w-full max-w-lg bg-gray-50 rounded-t-2xl max-h-[90vh] overflow-y-auto">
                        {detailLoading && (
                            <div className="flex items-center justify-center py-20">
                                <p className="text-gray-400 text-sm">Detay yükleniyor...</p>
                            </div>
                        )}

                        {detailError && !detailLoading && (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6">
                                <p className="text-red-500 text-sm text-center">{detailError}</p>
                                <button
                                    onClick={handleCloseDetail}
                                    className="text-sm text-gray-500 hover:underline"
                                >
                                    Geri Dön
                                </button>
                            </div>
                        )}

                        {selectedSession && !detailLoading && (
                            <div className="p-4">
                                <SessionDetailCard
                                    session={selectedSession}
                                    onConfirmPayment={() => { }}
                                    onClose={handleCloseDetail}
                                    isConfirming={false}
                                />
                                {selectedSession.paymentStatus === 'Pending' && (
                                    <div className="mt-3">
                                        <ConfirmPaymentButton
                                            sessionId={selectedSession.sessionId}
                                            onSuccess={handlePaymentConfirmed}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}