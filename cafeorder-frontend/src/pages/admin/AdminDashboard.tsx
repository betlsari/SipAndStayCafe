import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuApi } from '../../api/menu.api'
import { tableApi } from '../../api/table.api'
import { cashierApi } from '../../api/cashier.api'
import './AdminDashboard.css'
import { Tag, UtensilsCrossed, QrCode, TrendingUp, ArrowRight } from 'lucide-react'

interface StatCard {
    label: string
    value: string | number
    sub?: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
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
            .then(r => setItemCount(r.data.length))
            .catch(() => setItemCount('—'))

        tableApi.getAll()
            .then(r => setTableCount(r.data.filter(t => t.isActive).length))
            .catch(() => setTableCount('—'))

        cashierApi.getActiveSessions()
            .then(r => {
                setActiveSessionCount(r.data.length)
                const total = r.data.reduce((s, sess) => s + sess.totalAmount, 0)
                setRevenue(new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total))
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
            iconBg: '#EDF2E8',
            iconColor: '#5F7154',
            href: '/admin/items',
        },
        {
            label: 'Aktif Masa',
            value: tableCount,
            sub: 'sisteme tanımlı',
            icon: QrCode,
            iconBg: '#EEF4FE',
            iconColor: '#3A7FC8',
            href: '/admin/tables',
        },
        {
            label: 'Açık Oturum',
            value: activeSessionCount,
            sub: 'masada müşteri var',
            icon: Tag,
            iconBg: '#FEF6EE',
            iconColor: '#C8853A',
            href: '/cashier',
        },
        {
            label: 'Açık Masa Cirosu',
            value: revenue,
            sub: 'kapanmamış oturumlar',
            icon: TrendingUp,
            iconBg: '#FFF5F7',
            iconColor: '#FB7185',
            href: '/cashier',
        },
    ]

    return (
        <div className="admin-doodle-container p-8">
            {/* Header - Defter Yaprağı Stilinde */}
            <div className="notebook-header-sketch p-8 mb-10 max-w-4xl mx-auto relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-[#323232] rotate-[-1deg] tracking-tighter uppercase">
                        ADMİN PANELİ 
                    </h1>
                    <p className="text-sm font-bold text-stone-500 mt-2 italic">
                        {new Date().toLocaleDateString('tr-TR', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                    </p>
                </div>
                <span className="absolute right-6 top-4 text-6xl opacity-10 rotate-12">📝</span>
            </div>

            {/* Stat cards - Canlı Verili Doodle Kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
                {cards.map(card => {
                    const Icon = card.icon
                    return (
                        <button
                            key={card.label}
                            onClick={() => navigate(card.href)}
                            className="notebook-stat-card p-6 flex flex-col gap-4 text-left"
                        >
                            <div style={{
                                width: '42px', height: '42px',
                                borderRadius: '12px',
                                background: card.iconBg,
                                border: '2px solid #323232',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={20} color={card.iconColor} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-[#323232] tracking-tighter leading-none mb-1">
                                    {card.value}
                                </p>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{card.label}</p>
                            </div>
                            {card.sub && (
                                <p className="text-[10px] font-medium text-stone-400 italic leading-tight border-t border-dashed border-stone-200 pt-2">
                                    {card.sub}
                                </p>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Quick links - Doodle Butonlar */}
          
        </div>
    )
}