import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function WelcomeSplash() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const tableNumber = searchParams.get('table')
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const t1 = setTimeout(() => setVisible(true), 60)
        const t2 = setTimeout(() => {
            navigate(`/menu?table=${tableNumber}`, { replace: true })
        }, 2600)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [tableNumber, navigate])

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F7F5F0',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '24px', textAlign: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}>
                {/* Icon */}
                <div style={{
                    width: '100px', height: '100px',
                    background: '#fff',
                    borderRadius: '28px',
                    border: '1px solid #E0DDD6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px',
                    boxShadow: '0 4px 20px rgba(95,113,84,0.08)',
                }}>☕</div>

                {/* Text */}
                <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#82A76B', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>
                        Hoş Geldiniz
                    </p>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#2C3528', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                        Masa {tableNumber}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#8A8478', margin: 0, lineHeight: 1.6 }}>
                        Sip & Stay'e hoş geldiniz.<br />Menünüz hazırlanıyor…
                    </p>
                </div>

                {/* Dots */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: '#82A76B',
                                animation: 'bounce 1.2s ease-in-out infinite',
                                animationDelay: `${i * 0.18}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Skip */}
            <button
                onClick={() => navigate(`/menu?table=${tableNumber}`, { replace: true })}
                style={{
                    position: 'absolute', bottom: '28px',
                    background: 'none', border: 'none',
                    fontSize: '13px', color: '#B0AB9E',
                    cursor: 'pointer', textDecoration: 'underline',
                    fontFamily: 'inherit',
                }}
            >Menüye geç →</button>

            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
        </div>
    )
}