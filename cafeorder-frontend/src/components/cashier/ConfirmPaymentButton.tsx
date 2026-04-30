// src/components/cashier/ConfirmPaymentButton.tsx
import { useState } from 'react'
import { cashierApi } from '../../api/cashier.api'

interface ConfirmPaymentButtonProps {
    sessionId: string
    onSuccess?: () => void
}

export default function ConfirmPaymentButton({ sessionId, onSuccess }: ConfirmPaymentButtonProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmed, setConfirmed] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        setError(null)
        try {
            await cashierApi.confirmPayment(sessionId)
            setConfirmed(true)
            onSuccess?.()
        } catch {
            setError('Ödeme onaylanamadý. Tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    if (confirmed) {
        return (
            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Ödeme Onaylandý
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Onaylanýyor...
                    </>
                ) : (
                    'Ödemeyi Onayla'
                )}
            </button>

            {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
            )}
        </div>
    )
}