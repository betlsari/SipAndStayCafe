import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentApi } from '../../api/payment.api'
import type { AxiosError } from 'axios'

interface PaymentErrorResponse {
    code?: string
    message?: string
    detail?: string
    errors?: Record<string, string[]>
}

type PaymentMethod = 'cashier' | 'online'

export default function Payment() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const sessionId = searchParams.get('session')

    const [selected, setSelected] = useState<PaymentMethod | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null)
    const checkoutContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!sessionId) navigate('/')
    }, [sessionId, navigate])

    useEffect(() => {
        if (!checkoutHtml || !checkoutContainerRef.current) return

        const container = checkoutContainerRef.current
        container.innerHTML = checkoutHtml

        const scripts = container.querySelectorAll('script')
        scripts.forEach((oldScript) => {
            const newScript = document.createElement('script')
            Array.from(oldScript.attributes).forEach((attr) =>
                newScript.setAttribute(attr.name, attr.value)
            )
            newScript.textContent = oldScript.textContent
            oldScript.parentNode?.replaceChild(newScript, oldScript)
        })
    }, [checkoutHtml])

    const handleConfirm = async () => {
        if (!selected || !sessionId) return
        setLoading(true)
        setError(null)

        try {
            if (selected === 'cashier') {
                await paymentApi.initiateCashierPayment({ sessionId })
                navigate(`/payment-result?method=cashier`)
            } else {
                const res = await paymentApi.initiateOnlinePayment({ sessionId })
                setCheckoutHtml(res.data.checkoutFormContent)
            }
        } catch (err) {
            const axiosErr = err as AxiosError<PaymentErrorResponse>
            const data = axiosErr?.response?.data
            const code = data?.code

            if (code === 'Payment.AlreadyLocked') {
                setError('Bu masa için zaten bir ödeme işlemi başlatılmış.')
                return
            }
            if (code === 'Session.AlreadyClosed') {
                navigate('/payment-result?status=session-closed')
                return
            }

            const errorsDict = data?.errors
            if (errorsDict) {
                const firstMsg = Object.values(errorsDict).flat()[0]
                if (firstMsg) {
                    setError(firstMsg)
                    return
                }
            }

            const detail = data?.detail
            if (detail) {
                if (detail.includes('zaten kapatılmış') || detail.includes('AlreadyClosed')) {
                    navigate('/payment-result?status=session-closed')
                    return
                }
                if (detail.includes('zaten') && detail.includes('ödeme')) {
                    setError('Bu masa için zaten bir ödeme işlemi başlatılmış.')
                    return
                }
                setError(detail)
                return
            }

            setError('Ödeme başlatılamadı. Lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    if (checkoutHtml) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3">
                    <h1 className="text-lg font-bold text-gray-800">Online Ödeme</h1>
                </div>
                <div className="p-4" ref={checkoutContainerRef} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">←</button>
                <h1 className="text-lg font-bold text-gray-800">Ödeme Yöntemi</h1>
            </div>

            <div className="px-4 py-6 flex flex-col gap-4">
                <p className="text-sm text-gray-500 text-center">Nasıl ödemek istersiniz?</p>

                <button
                    onClick={() => setSelected('cashier')}
                    className={`w-full bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border-2 transition-colors text-left ${selected === 'cashier' ? 'border-purple-500' : 'border-transparent'
                        }`}
                >
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-2xl">🧾</div>
                    <div>
                        <p className="font-semibold text-gray-800">Kasada Öde</p>
                        <p className="text-xs text-gray-500 mt-0.5">Nakit veya kart ile kasiyere ödeme yapın.</p>
                    </div>
                    {selected === 'cashier' && <span className="ml-auto text-purple-500 text-xl">✓</span>}
                </button>

                <button
                    onClick={() => setSelected('online')}
                    className={`w-full bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border-2 transition-colors text-left ${selected === 'online' ? 'border-purple-500' : 'border-transparent'
                        }`}
                >
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-2xl">💳</div>
                    <div>
                        <p className="font-semibold text-gray-800">Online Öde</p>
                        <p className="text-xs text-gray-500 mt-0.5">Kredi/banka kartı ile güvenli online ödeme yapın.</p>
                    </div>
                    {selected === 'online' && <span className="ml-auto text-purple-500 text-xl">✓</span>}
                </button>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4">
                <button
                    onClick={handleConfirm}
                    disabled={!selected || loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                    {loading ? 'İşleniyor...' : 'Devam Et'}
                </button>
            </div>
        </div>
    )
}