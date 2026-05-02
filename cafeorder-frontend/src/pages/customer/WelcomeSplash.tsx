import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function WelcomeSplash() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const tableNumber = searchParams.get('table')
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Trigger entrance animation
        const t1 = setTimeout(() => setVisible(true), 50)
        // Auto-redirect to menu after 2.5s
        const t2 = setTimeout(() => {
            navigate(`/menu?table=${tableNumber}`, { replace: true })
        }, 2500)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [tableNumber, navigate])

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-hidden">
            {/* Radial glow background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(139,92,246,0.12) 0%, transparent 70%)',
                }}
            />

            <div
                className="relative z-10 flex flex-col items-center gap-8 text-center transition-all duration-700"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(24px)',
                }}
            >
                {/* Logo / Icon */}
                <div className="relative">
                    <div className="w-28 h-28 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-6xl shadow-2xl">
                        ☕
                    </div>
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-violet-500/30 animate-ping" />
                </div>

                {/* Greeting */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.3em]">
                        Hoş Geldiniz
                    </p>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        Masa {tableNumber}
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Sip & Stay Cafe'ye hoş geldiniz.
                        <br />
                        Menünüz hazırlanıyor…
                    </p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>

            {/* Skip link */}
            <button
                onClick={() => navigate(`/menu?table=${tableNumber}`, { replace: true })}
                className="absolute bottom-8 text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
            >
                Menüye geç →
            </button>
        </div>
    )
}