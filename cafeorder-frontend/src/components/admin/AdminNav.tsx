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

function NavItem({ to, label, icon: Icon, end }: typeof NAV_ITEMS[0]) {
    return (
        <NavLink
            to={to}
            end={end}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s',
                background: isActive ? '#EDF2E8' : 'transparent',
                color: isActive ? '#3D4A36' : '#8A8478',
                borderLeft: isActive ? '3px solid #5F7154' : '3px solid transparent',
            })}
        >
            {({ isActive }) => (
                <>
                    <Icon size={15} color={isActive ? '#5F7154' : '#B0AB9E'} />
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
            <aside
                className="hidden lg:flex"
                style={{
                    width: '220px',
                    flexShrink: 0,
                    background: '#FDFCF9',
                    borderRight: '1px solid #EDE9E0',
                    minHeight: '100vh',
                    position: 'sticky',
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Brand */}
                <div style={{
                    padding: '22px 20px 18px',
                    borderBottom: '1px solid #EDE9E0',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            background: '#EDF2E8',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                        }}>☕</div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#2C3528', margin: 0 }}>Sip & Stay</p>
                            <p style={{ fontSize: '11px', color: '#9A8E80', margin: '1px 0 0' }}>Yönetim Paneli</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
                </nav>

                {/* Footer */}
                <div style={{ padding: '12px 10px', borderTop: '1px solid #EDE9E0' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 500,
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#8A8478',
                            fontFamily: 'system-ui, sans-serif',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = '#FAE8EE'
                                ; (e.currentTarget as HTMLElement).style.color = '#8B3A5A'
                        }}
                        onMouseLeave={e => {
                            ; (e.currentTarget as HTMLElement).style.background = 'none'
                                ; (e.currentTarget as HTMLElement).style.color = '#8A8478'
                        }}
                    >
                        <LogOut size={15} />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav
                className="lg:hidden"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: '#FDFCF9',
                    borderTop: '1px solid #EDE9E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: '6px 4px 8px',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                {NAV_ITEMS.map(({ to, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: isActive ? '#5F7154' : '#B0AB9E',
                        })}
                    >
                        {({ isActive }) => <Icon size={18} color={isActive ? '#5F7154' : '#B0AB9E'} />}
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '4px 8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#B0AB9E',
                    }}
                >
                    <LogOut size={18} />
                </button>
            </nav>
        </>
    )
}