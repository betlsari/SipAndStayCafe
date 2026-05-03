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
                navigate('/payment-result?method=cashier')
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
                if (firstMsg) { setError(firstMsg); return }
            }

            const detail = data?.detail
            if (detail) {
                if (detail.includes('zaten kapatılmış') || detail.includes('AlreadyClosed')) {
                    navigate('/payment-result?status=session-closed')
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

    // Online ödeme formu açıldıysa
    if (checkoutHtml) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#F7F5F0',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
                {/* Header */}
                <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: 'rgba(247,245,240,0.95)',
                    backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid #E0DDD6',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <button
                        onClick={() => setCheckoutHtml(null)}
                        style={{
                            width: '34px',
                            height: '34px',
                            background: '#FFFFFF',
                            border: '1px solid #E0DDD6',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: '#5F7154',
                        }}
                    >←</button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#2C3528' }}>
                            Güvenli Ödeme
                        </h1>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8A8478' }}>İyzico güvencesiyle</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>🔒</span>
                        <span style={{ fontSize: '12px', color: '#5F7154', fontWeight: 500 }}>SSL Şifreli</span>
                    </div>
                </div>

                {/* İyzico form alanı */}
                <div style={{ padding: '20px', maxWidth: '520px', margin: '0 auto' }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '18px',
                        border: '1px solid #E8E4DC',
                        padding: '20px',
                        boxShadow: '0 2px 12px rgba(95,113,84,0.06)',
                    }}>
                        {/* Güvenlik başlığı */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 14px',
                            background: '#EDF2E8',
                            borderRadius: '12px',
                            marginBottom: '20px',
                        }}>
                            <span style={{ fontSize: '18px' }}>💳</span>
                            <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#3D5C34' }}>
                                    Kart Bilgileriniz Güvende
                                </p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#5F7154' }}>
                                    Bilgileriniz hiçbir zaman saklanmaz
                                </p>
                            </div>
                        </div>

                        <div ref={checkoutContainerRef} />
                    </div>

                    {/* İyzico logo */}
                    <p style={{
                        textAlign: 'center',
                        fontSize: '11px',
                        color: '#B0AB9E',
                        marginTop: '16px',
                    }}>
                        Ödeme altyapısı İyzico tarafından sağlanmaktadır
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F7F5F0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(247,245,240,0.95)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #E0DDD6',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        width: '34px',
                        height: '34px',
                        background: '#FFFFFF',
                        border: '1px solid #E0DDD6',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: '#5F7154',
                    }}
                >←</button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#2C3528' }}>
                        Ödeme Yöntemi
                    </h1>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8A8478' }}>Nasıl ödemek istersiniz?</p>
                </div>
            </div>

            {/* İçerik */}
            <div style={{
                flex: 1,
                padding: '24px 20px',
                maxWidth: '520px',
                margin: '0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
            }}>

                {/* Kasada Öde */}
                <button
                    onClick={() => setSelected('cashier')}
                    style={{
                        width: '100%',
                        background: '#FFFFFF',
                        border: selected === 'cashier' ? '2px solid #5F7154' : '1px solid #E0DDD6',
                        borderRadius: '18px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        boxShadow: selected === 'cashier'
                            ? '0 4px 16px rgba(95,113,84,0.12)'
                            : '0 2px 8px rgba(95,113,84,0.05)',
                    }}
                >
                    {/* İkon */}
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: selected === 'cashier' ? '#EDF2E8' : '#F7F5F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                    }}>🧾</div>

                    {/* Metin */}
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: '0 0 3px',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#2C3528',
                        }}>Kasada Öde</p>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#8A8478',
                            lineHeight: 1.4,
                        }}>Nakit veya kredi kartıyla kasiyere öde</p>
                    </div>

                    {/* Seçim göstergesi */}
                    <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: selected === 'cashier' ? 'none' : '1.5px solid #C8D5C0',
                        background: selected === 'cashier' ? '#5F7154' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                    }}>
                        {selected === 'cashier' && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                        )}
                    </div>
                </button>

                {/* Online Öde */}
                <button
                    onClick={() => setSelected('online')}
                    style={{
                        width: '100%',
                        background: '#FFFFFF',
                        border: selected === 'online' ? '2px solid #5F7154' : '1px solid #E0DDD6',
                        borderRadius: '18px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        boxShadow: selected === 'online'
                            ? '0 4px 16px rgba(95,113,84,0.12)'
                            : '0 2px 8px rgba(95,113,84,0.05)',
                    }}
                >
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: selected === 'online' ? '#EDF2E8' : '#F7F5F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                    }}>💳</div>

                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: '0 0 3px',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#2C3528',
                        }}>Online Öde</p>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#8A8478',
                            lineHeight: 1.4,
                        }}>Kredi / banka kartıyla güvenli ödeme</p>
                    </div>

                    <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: selected === 'online' ? 'none' : '1.5px solid #C8D5C0',
                        background: selected === 'online' ? '#5F7154' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                    }}>
                        {selected === 'online' && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                        )}
                    </div>
                </button>

                {/* Bilgi kartı — seçime göre */}
                {selected === 'cashier' && (
                    <div style={{
                        background: '#FEF6EE',
                        border: '1px solid #F0C88060',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                    }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
                        <p style={{ margin: 0, fontSize: '13px', color: '#7A5C1A', lineHeight: 1.5 }}>
                            Kasiyere bildirim gönderilecek. Lütfen kasaya gidiniz, ödemeniz tamamlandıktan sonra masanız kapatılacaktır.
                        </p>
                    </div>
                )}

                {selected === 'online' && (
                    <div style={{
                        background: '#EDF2E8',
                        border: '1px solid #82A76B40',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                    }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>🔒</span>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3D5C34', lineHeight: 1.5 }}>
                            İyzico güvenli ödeme altyapısı ile işleminiz şifrelenerek gerçekleştirilecektir.
                        </p>
                    </div>
                )}

                {/* Hata mesajı */}
                {error && (
                    <div style={{
                        background: '#FEF0EE',
                        border: '1px solid #E0907060',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '14px' }}>⚠️</span>
                        <p style={{ margin: 0, fontSize: '13px', color: '#7A3530' }}>{error}</p>
                    </div>
                )}
            </div>

            {/* Alt buton alanı */}
            <div style={{
                position: 'sticky',
                bottom: 0,
                background: 'rgba(247,245,240,0.97)',
                borderTop: '1px solid #E0DDD6',
                padding: '16px 20px',
                backdropFilter: 'blur(8px)',
            }}>
                <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                    <button
                        onClick={handleConfirm}
                        disabled={!selected || loading}
                        style={{
                            width: '100%',
                            padding: '15px',
                            borderRadius: '14px',
                            border: 'none',
                            background: !selected
                                ? '#D8D4CC'
                                : loading
                                    ? '#8FAF80'
                                    : '#5F7154',
                            color: !selected ? '#9A8E80' : '#FFFFFF',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: !selected || loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: 'system-ui, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        {loading && (
                            <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#fff',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                        )}
                        {loading
                            ? 'İşleniyor…'
                            : !selected
                                ? 'Ödeme Yöntemi Seçin'
                                : selected === 'cashier'
                                    ? 'Kasiyere Bildir'
                                    : 'Ödemeye Geç'}
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}