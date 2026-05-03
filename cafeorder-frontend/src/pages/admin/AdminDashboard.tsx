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
            sub: 'şu an masada müşteri var',
            icon: Tag,
            iconBg: '#FEF6EE',
            iconColor: '#C8853A',
            href: '/cashier',
        },
        {
            label: 'Açık Masa Cirosu',
            value: revenue,
            sub: 'henüz kapanmamış oturumlar',
            icon: TrendingUp,
            iconBg: '#EDF2E8',
            iconColor: '#5F7154',
            href: '/cashier',
        },
    ]

    return (
        <div style={{
            padding: '32px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            maxWidth: '900px',
        }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2C3528', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                    Genel Bakış
                </h1>
                <p style={{ fontSize: '13px', color: '#9A8E80', margin: 0 }}>
                    {new Date().toLocaleDateString('tr-TR', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                </p>
            </div>

            {/* Stat cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '14px',
                marginBottom: '32px',
            }}>
                {cards.map(card => {
                    const Icon = card.icon
                    return (
                        <button
                            key={card.label}
                            onClick={() => navigate(card.href)}
                            style={{
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                border: '1px solid #E8E4DC',
                                padding: '18px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: '0 1px 4px rgba(95,113,84,0.05)',
                            }}
                            onMouseEnter={e => {
                                ; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(95,113,84,0.10)'
                                    ; (e.currentTarget as HTMLElement).style.borderColor = '#C8D5C0'
                            }}
                            onMouseLeave={e => {
                                ; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(95,113,84,0.05)'
                                    ; (e.currentTarget as HTMLElement).style.borderColor = '#E8E4DC'
                            }}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: card.iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Icon size={16} color={card.iconColor} />
                            </div>
                            <div>
                                <p style={{ fontSize: '22px', fontWeight: 600, color: '#2C3528', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
                                    {card.value}
                                </p>
                                <p style={{ fontSize: '12px', color: '#9A8E80', margin: 0 }}>{card.label}</p>
                            </div>
                            {card.sub && (
                                <p style={{ fontSize: '11px', color: '#B0AB9E', margin: 0, lineHeight: 1.4 }}>{card.sub}</p>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #EDE9E0', marginBottom: '24px' }} />

            {/* Quick links */}
            <div>
                <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#9A8E80', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
                    Hızlı Erişim
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        { label: 'Kategori Yönetimi', href: '/admin/categories', desc: 'Menü kategorilerini düzenle' },
                        { label: 'Ürün Yönetimi', href: '/admin/items', desc: 'Menü ürünlerini ve fiyatları yönet' },
                        { label: 'Masa & QR Yönetimi', href: '/admin/tables', desc: 'Masaları ekle, QR kodları indir' },
                        { label: 'Raporlar', href: '/admin/reports', desc: 'Günlük ve haftalık satış analizleri' },
                        { label: 'Kullanıcı Yönetimi', href: '/admin/users', desc: 'Personel hesaplarını yönet' },
                    ].map(link => (
                        <button
                            key={link.href}
                            onClick={() => navigate(link.href)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#FFFFFF',
                                border: '1px solid #E8E4DC',
                                borderRadius: '12px',
                                padding: '13px 16px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                textAlign: 'left',
                                fontFamily: 'system-ui, sans-serif',
                            }}
                            onMouseEnter={e => {
                                ; (e.currentTarget as HTMLElement).style.borderColor = '#C8D5C0'
                                    ; (e.currentTarget as HTMLElement).style.background = '#FDFCF9'
                            }}
                            onMouseLeave={e => {
                                ; (e.currentTarget as HTMLElement).style.borderColor = '#E8E4DC'
                                    ; (e.currentTarget as HTMLElement).style.background = '#FFFFFF'
                            }}
                        >
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C3528', margin: '0 0 2px' }}>{link.label}</p>
                                <p style={{ fontSize: '12px', color: '#9A8E80', margin: 0 }}>{link.desc}</p>
                            </div>
                            <ArrowRight size={15} color="#C8D5C0" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}