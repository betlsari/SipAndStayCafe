import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Tag,
    UtensilsCrossed,
    QrCode,
    BarChart2,
    Users,
    LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth.api'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
    { to: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
    { to: '/admin/categories', label: 'Kategoriler', icon: Tag },
    { to: '/admin/items', label: 'Ürünler', icon: UtensilsCrossed },
    { to: '/admin/tables', label: 'Masalar', icon: QrCode },
    { to: '/admin/reports', label: 'Raporlar', icon: BarChart2 },
    { to: '/admin/users', label: 'Kullanıcılar', icon: Users },
]

export default function AdminNav() {
    const navigate = useNavigate()
    const clearAuth = useAuthStore((s) => s.clearAuth)

    const handleLogout = async () => {
        await authApi.logout()
        clearAuth()
        navigate('/login', { replace: true })
    }

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 min-h-screen sticky top-0">
                <div className="px-5 py-5 border-b border-zinc-800">
                    <span className="text-white font-bold text-base tracking-tight">☕ SipAndStay</span>
                    <p className="text-xs text-zinc-500 mt-0.5">Yönetim Paneli</p>
                </div>

                <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                    ? 'bg-violet-600 text-white'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-zinc-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800 w-full transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* ── Mobile bottom nav ── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-1 py-2">
                {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${isActive ? 'text-violet-400' : 'text-zinc-500'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{label}</span>
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-zinc-500 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Çıkış</span>
                </button>
            </nav>
        </>
    )
}