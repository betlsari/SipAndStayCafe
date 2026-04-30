import React from 'react';
import type { PaymentStatus, PaymentMethod } from '../../types';
interface PaymentBadgeProps {
    status: PaymentStatus;
    method?: PaymentMethod | null;
}

const PAYMENT_STATUS_CONFIG: Record<
    PaymentStatus,
    { label: string; cls: string }
> = {
    None: { label: 'Bekliyor', cls: 'bg-zinc-700 text-zinc-300' },
    Pending: { label: 'Ödeme Talep', cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' },
    Completed: { label: 'Ödendi', cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' },
    Failed: { label: 'Baþarýsýz', cls: 'bg-red-500/20 text-red-300 border border-red-500/40' },
};

const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status, method }) => {
    const cfg = PAYMENT_STATUS_CONFIG[status];
    return (
        <>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                {cfg.label}
            </span>
            {method && method !== 'None' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
                    {method === 'Cashier' ? 'Kasa' : 'Online'}
                </span>
            )}
        </>
    );
};

export default PaymentBadge;