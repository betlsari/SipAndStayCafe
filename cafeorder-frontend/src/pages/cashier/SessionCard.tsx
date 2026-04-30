import * as React from 'react';
import type { CashierSessionDto } from '../../types/index';
import PaymentBadge from './PaymentBadge';

interface SessionCardProps {
    session: CashierSessionDto;
    highlight: boolean;
    onConfirm: (sessionId: string) => void;
    confirmingId: string | null;
}

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

const elapsedMinutes = (iso: string) => {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
};

const SessionCard: React.FC<SessionCardProps> = ({ session, highlight, onConfirm, confirmingId }) => {
    const mins = elapsedMinutes(session.openedAt);
    const isPending = session.paymentStatus === 'Pending';
    const isCompleted = session.paymentStatus === 'Completed';
    const isConfirming = confirmingId === session.sessionId;

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
                    <PaymentBadge status={session.paymentStatus} method={session.paymentMethod} />
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm border-t border-zinc-800 pt-3">
                <div>
                    <p className="text-zinc-500 text-xs">Sipariþ</p>
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
                    {isConfirming ? 'Ýþleniyor…' : 'Ödemeyi Onayla'}
                </button>
            )}
        </div>
    );
};

export default SessionCard;