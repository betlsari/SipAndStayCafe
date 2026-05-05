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
        }, 2800)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [tableNumber, navigate])

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F7F9F2',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
            position: 'relative',
            overflow: 'hidden',
        }}>

            {/* Background blobs */}
            <div style={{
                position: 'absolute',
                top: '-80px',
                right: '-60px',
                width: '320px',
                height: '320px',
                borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%',
                background: '#F0FEAD',
                opacity: 0.55,
                zIndex: 0,
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-60px',
                left: '-40px',
                width: '260px',
                height: '260px',
                borderRadius: '45% 55% 40% 60% / 55% 45% 65% 35%',
                background: '#FFD4E8',
                opacity: 0.35,
                zIndex: 0,
            }} />

            {/* Doodle — leaf top-left */}
            <svg style={{ position: 'absolute', top: 40, left: 32, opacity: 0.18, zIndex: 0 }} width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M8 40 C8 20, 28 8, 40 8 C40 28, 20 40, 8 40Z" stroke="#5F7154" strokeWidth="1.5" fill="#5F7154" fillOpacity="0.25" />
                <path d="M8 40 L24 24" stroke="#5F7154" strokeWidth="1.2" strokeLinecap="round" />
            </svg>

            {/* Doodle — coffee bean bottom-right */}
            <svg style={{ position: 'absolute', bottom: 60, right: 36, opacity: 0.15, zIndex: 0 }} width="36" height="36" viewBox="0 0 36 36" fill="none">
                <ellipse cx="18" cy="18" rx="14" ry="9" stroke="#5F7154" strokeWidth="1.5" fill="#5F7154" fillOpacity="0.2" />
                <path d="M18 9 C12 14, 12 22, 18 27" stroke="#5F7154" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>

            {/* Doodle — small leaf mid-left */}
            <svg style={{ position: 'absolute', top: '45%', left: 20, opacity: 0.12, zIndex: 0 }} width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 24 C4 12, 16 4, 24 4 C24 16, 12 24, 4 24Z" stroke="#5F7154" strokeWidth="1.2" fill="#5F7154" fillOpacity="0.3" />
                <path d="M4 24 L14 14" stroke="#5F7154" strokeWidth="1" strokeLinecap="round" />
            </svg>

            {/* Main content */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '28px',
                textAlign: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.65s ease, transform 0.65s ease',
                position: 'relative',
                zIndex: 1,
            }}>

                {/* Icon card */}
                <div style={{
                    width: '110px',
                    height: '110px',
                    background: '#FFFFFF',
                    borderRadius: '32px',
                    border: '1.5px solid #E4EAD8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '52px',
                    boxShadow: '0 8px 32px rgba(47, 53, 59, 0.10), 0 0 0 6px rgba(240, 254, 173, 0.45)',
                }}>☕</div>

                {/* Tag */}
                <div style={{
                    background: '#F0FEAD',
                    color: '#3D4A36',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.13em',
                    textTransform: 'uppercase',
                    padding: '5px 16px',
                    borderRadius: '20px',
                    marginBottom: '-12px',
                }}>Hoş Geldiniz</div>

                {/* Heading */}
                <div>
                    <h1 style={{
                        fontSize: '38px',
                        fontWeight: 700,
                        color: '#2F353B',
                        margin: '0 0 8px',
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        fontFamily: "'Lora', 'Georgia', serif",
                    }}>
                        Masa {tableNumber}
                    </h1>
                    <p style={{
                        fontSize: '15px',
                        color: '#6E7680',
                        margin: 0,
                        lineHeight: 1.65,
                        maxWidth: '240px',
                    }}>
                        Sip & Stay'e hoş geldiniz.<br />Menünüz hazırlanıyor…
                    </p>
                </div>

                {/* Dots */}
                <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: i === 1 ? '10px' : '7px',
                                height: i === 1 ? '10px' : '7px',
                                borderRadius: '50%',
                                background: i === 1 ? '#FF88BA' : '#5F7154',
                                animation: 'splash-bounce 1.3s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Skip button */}
            <button
                onClick={() => navigate(`/menu?table=${tableNumber}`, { replace: true })}
                style={{
                    position: 'absolute',
                    bottom: '32px',
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    color: '#9EA5AC',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '0.01em',
                    zIndex: 1,
                    padding: '8px 16px',
                    borderRadius: '20px',
                    transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#5F7154'
                        ; (e.currentTarget as HTMLElement).style.background = '#EDF5E6'
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = '#9EA5AC'
                        ; (e.currentTarget as HTMLElement).style.background = 'none'
                }}
            >
                Menüye geç →
            </button>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                @keyframes splash-bounce {
                    0%, 80%, 100% { transform: translateY(0);   opacity: 0.45; }
                    40%           { transform: translateY(-9px); opacity: 1;    }
                }
            `}</style>
        </div>
    )
}