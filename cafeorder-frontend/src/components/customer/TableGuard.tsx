import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tableApi } from '../../api/table.api'

type GuardState = 'checking' | 'valid' | 'invalid' | 'inactive' | 'error'

interface Props {
    children: React.ReactNode
}

export default function TableGuard({ children }: Props) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const tableNumber = Number(searchParams.get('table'))

    // Derive initial state synchronously — no effect needed for the param check
    const isParamValid = tableNumber > 0 && !isNaN(tableNumber)
    const [state, setState] = useState<GuardState>(isParamValid ? 'checking' : 'invalid')

    useEffect(() => {
        // Skip API call if param was already invalid
        if (!isParamValid) return

        let cancelled = false

        const verify = async () => {
            try {
                const res = await tableApi.getAll()
                if (cancelled) return

                const table = res.data.find((t) => t.tableNumber === tableNumber)

                if (!table) {
                    setState('invalid')
                } else if (!table.isActive) {
                    setState('inactive')
                } else {
                    setState('valid')
                }
            } catch {
                if (!cancelled) setState('error')
            }
        }

        verify()
        return () => { cancelled = true }
    }, [tableNumber, isParamValid])

    if (state === 'checking') {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
                {/* Animated coffee cup */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl animate-pulse">
                        ☕
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full animate-ping" />
                </div>
                <p className="text-zinc-400 text-sm font-medium tracking-wide">Masa doğrulanıyor…</p>
            </div>
        )
    }

    if (state === 'valid') {
        return <>{children}</>
    }

    // --- Error states ---
    const config = {
        invalid: {
            emoji: '🔍',
            title: 'Masa Bulunamadı',
            desc: 'Bu QR koda ait bir masa sistemde kayıtlı değil. Lütfen masanızdaki QR kodu tekrar okutun veya personele başvurun.',
            action: null,
        },
        inactive: {
            emoji: '🚫',
            title: 'Masa Şu An Aktif Değil',
            desc: `Masa ${tableNumber} geçici olarak hizmet dışı. Lütfen personele danışın.`,
            action: null,
        },
        error: {
            emoji: '📡',
            title: 'Bağlantı Hatası',
            desc: 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edip tekrar deneyin.',
            action: 'retry',
        },
    }[state]

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
            {/* Background subtle pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle, #a78bfa 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 text-center">
                {/* Icon */}
                <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-5xl shadow-2xl">
                    {config.emoji}
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">{config.title}</h1>
                    <p className="text-sm text-zinc-400 leading-relaxed">{config.desc}</p>
                </div>

                {/* QR hint card */}
                <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-xl">
                        📱
                    </div>
                    <p className="text-xs text-zinc-400 text-left leading-relaxed">
                        Masanızın üzerindeki QR kodu telefonunuzun kamerası ile okutun.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full">
                    {config.action === 'retry' && (
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95 text-sm"
                        >
                            Tekrar Dene
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium py-3 rounded-2xl transition-all active:scale-95 text-sm"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-zinc-600">
                    ☕ Sip & Stay Cafe
                </p>
            </div>
        </div>
    )
}