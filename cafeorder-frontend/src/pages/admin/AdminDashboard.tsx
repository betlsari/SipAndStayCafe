import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuApi } from '../../api/menu.api'
import { tableApi } from '../../api/table.api'
import { cashierApi } from '../../api/cashier.api'
import { Tag, UtensilsCrossed, QrCode, TrendingUp, ArrowRight } from 'lucide-react'

interface StatCard {
    label: string
    value: string | number
    sub?: string
    icon: React.ElementType
    iconCls: string
    href: string
}

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [itemCount, setItemCount] = useState<number | '—'>('—')
    const [tableCount, setTableCount] = useState<number | '—'>('—')
    const [activeSessionCount, setActiveSessionCount] = useState<number | '—'>('—')
    const [revenue, setRevenue] = useState<string>('—')

    useEffect(() => {
        menuApi.getAllItems()
            .then((r) => setItemCount(r.data.length))
            .catch(() => setItemCount('—'))

        tableApi.getAll()
            .then((r) => setTableCount(r.data.filter((t) => t.isActive).length))
            .catch(() => setTableCount('—'))

        cashierApi.getActiveSessions()
            .then((r) => {
                setActiveSessionCount(r.data.length)
                const total = r.data.reduce((s, sess) => s + sess.totalAmount, 0)
                setRevenue(
                    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total)
                )
            })
            .catch(() => {
                setActiveSessionCount('—')
                setRevenue('—')
            })
    }, [])

    const cards: StatCard[] = [
        {
            label: 'Aktif Ürün',
            value: itemCount,
            sub: 'menüdeki toplam ürün',
            icon: UtensilsCrossed,
            iconCls: 'bg-violet-500/20 text-violet-400',
            href: '/admin/items',
        },
        {
            label: 'Aktif Masa',
            value: tableCount,
            sub: 'sisteme tanımlı',
            icon: QrCode,
            iconCls: 'bg-sky-500/20 text-sky-400',
            href: '/admin/tables',
        },
        {
            label: 'Açık Oturum',
            value: activeSessionCount,
            sub: 'şu an masada müşteri var',
            icon: Tag,
            iconCls: 'bg-amber-500/20 text-amber-400',
            href: '/admin/reports',
        },
        {
            label: 'Açık Masa Cirosu',
            value: revenue,
            sub: 'henüz kapanmamış oturumlar',
            icon: TrendingUp,
            iconCls: 'bg-emerald-500/20 text-emerald-400',
            href: '/admin/reports',
        },
    ]

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Genel Bakış</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    {new Date().toLocaleDateString('tr-TR', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <button
                            key={card.label}
                            onClick={() => navigate(card.href)}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 text-left hover:border-zinc-600 transition-colors group"
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconCls}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{card.value}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
                            </div>
                            <p className="text-xs text-zinc-600">{card.sub}</p>
                        </button>
                    )
                })}
            </div>

            {/* Quick links */}
            <div className="flex flex-col gap-2">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Hızlı Erişim</h2>
                <div className="flex flex-col gap-2">
                    {[
                        { label: 'Kategori Yönetimi', href: '/admin/categories' },
                        { label: 'Ürün Yönetimi', href: '/admin/items' },
                        { label: 'Masa & QR Yönetimi', href: '/admin/tables' },
                        { label: 'Raporlar', href: '/admin/reports' },
                        { label: 'Kullanıcı Yönetimi', href: '/admin/users' },
                    ].map((link) => (
                        <button
                            key={link.href}
                            onClick={() => navigate(link.href)}
                            className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors group"
                        >
                            {link.label}
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}