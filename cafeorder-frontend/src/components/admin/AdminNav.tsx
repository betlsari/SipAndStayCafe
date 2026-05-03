import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Tag, UtensilsCrossed,
    QrCode, BarChart2, Users, LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth.api'

const NAV_ITEMS = [
    { to: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
    { to: '/admin/categories', label: 'Kategoriler', icon: Tag },
    { to: '/admin/items', label: 'Ürünler', icon: UtensilsCrossed },
    { to: '/admin/tables', label: 'Masalar', icon: QrCode },
    { to: '/admin/reports', label: 'Raporlar', icon: BarChart2 },
    { to: '/admin/users', label: 'Kullanıcılar', icon: Users },
]

const S: Record<string, React.CSSProperties> = {
    sidebar: {
        width: '220px', flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-soft)',
        minHeight: '100vh', position: 'sticky', top: 0,
        display: 'flex', flexDirection: 'column',
    },
    brand: {
        padding: '22px 20px 16px',
        borderBottom: '1px solid var(--border-soft)',
    },
    brandTitle: { fontSize: '16px', fontWeight: 700, color: 'var(--text-h)', margin: 0 },
    brandSub: { fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' },
    nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' },
    foot: { padding: '12px 10px', borderTop: '1px solid var(--border-soft)' },
    mobileNav: {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '6px 4px 8px',
    },
}

function NavItem({ to, label, icon: Icon, end }: typeof NAV_ITEMS[0]) {
    return (
        <NavLink
            to={to} end={end}
            style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: 'var(--radius-md)',
                fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.15s',
                background: isActive ? 'var(--green-pale)' : 'transparent',
                color: isActive ? 'var(--green)' : 'var(--text-muted)',
            })}
        >
            {({ isActive }) => (
                <>
                    <Icon size={15} color={isActive ? 'var(--green)' : 'var(--text-soft)'} />
                    {label}
                </>
            )}
        </NavLink>
    )
}

export default function AdminNav() {
    const navigate = useNavigate()
    const clearAuth = useAuthStore(s => s.clearAuth)

    const handleLogout = async () => {
        await authApi.logout()
        clearAuth()
        navigate('/login', { replace: true })
    }

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex" style={{ ...S.sidebar, flexDirection: 'column' }}>
                <div style={S.brand}>
                    <p style={S.brandTitle}>☕ Sip & Stay</p>
                    <p style={S.brandSub}>Yönetim Paneli</p>
                </div>
                <nav style={S.nav}>
                    {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
                </nav>
                <div style={S.foot}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 12px', borderRadius: 'var(--radius-md)',
                            fontSize: '13px', fontWeight: 500, width: '100%',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontFamily: 'var(--font)',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--pink-pale)'; (e.currentTarget as HTMLElement).style.color = 'var(--pink-dark)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                    >
                        <LogOut size={15} />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden" style={S.mobileNav}>
                {NAV_ITEMS.map(({ to, icon: Icon, end }) => (
                    <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        color: isActive ? 'var(--green)' : 'var(--text-soft)',
                    })}>
                        {({ isActive }) => <Icon size={18} color={isActive ? 'var(--green)' : 'var(--text-soft)'} />}
                    </NavLink>
                ))}
                <button onClick={handleLogout} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                    padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-soft)',
                }}>
                    <LogOut size={18} />
                </button>
            </nav>
        </>
    )
}