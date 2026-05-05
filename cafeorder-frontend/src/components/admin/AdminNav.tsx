import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Tag, UtensilsCrossed,
    QrCode, BarChart2, Users, LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth.api'

const NAV_ITEMS = [
    { to: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, end: true, emoji: '📊' },
    { to: '/admin/categories', label: 'Kategoriler', icon: Tag, emoji: '🏷️' },
    { to: '/admin/items', label: 'Ürünler', icon: UtensilsCrossed, emoji: '🍽️' },
    { to: '/admin/tables', label: 'Masalar', icon: QrCode, emoji: '🪑' },
    { to: '/admin/reports', label: 'Raporlar', icon: BarChart2, emoji: '📈' },
    { to: '/admin/users', label: 'Kullanıcılar', icon: Users, emoji: '👥' },
]

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
            <style>{`
                .admin-nav-sidebar {
                    font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive;
                }

                .nav-brand {
                    padding: 22px 18px 18px;
                    border-bottom: 2px dashed #323232;
                    position: relative;
                }

                .nav-brand-inner {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .nav-brand-icon {
                    width: 44px;
                    height: 44px;
                    background: #ffe66d;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    box-shadow: 3px 3px 0 #323232;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    flex-shrink: 0;
                }

                .nav-brand-title {
                    font-size: 15px;
                    font-weight: 900;
                    color: #323232;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    line-height: 1.1;
                    transform: rotate(-1deg);
                    display: block;
                }

                .nav-brand-sub {
                    font-size: 10px;
                    color: #666;
                    margin: 2px 0 0;
                    display: block;
                    font-style: italic;
                }

                .nav-items-list {
                    flex: 1;
                    padding: 14px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    list-style: none;
                    margin: 0;
                }

                .nav-link-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    font-size: 13px;
                    font-weight: 700;
                    text-decoration: none;
                    color: #666;
                    border: 2px solid transparent;
                    transition: all 0.15s;
                    position: relative;
                    font-family: inherit;
                }

                .nav-link-item:hover {
                    background: #fff9e6;
                    border-color: #323232;
                    color: #323232;
                    box-shadow: 2px 2px 0 #323232;
                    transform: translate(-1px, -1px);
                }

                .nav-link-item.active {
                    background: #ffe66d;
                    border: 2px solid #323232;
                    color: #323232;
                    box-shadow: 3px 3px 0 #323232;
                    transform: rotate(-0.5deg);
                }

                .nav-link-item.active::before {
                    content: '►';
                    position: absolute;
                    left: -18px;
                    font-size: 10px;
                    color: #323232;
                }

                .nav-link-emoji {
                    font-size: 15px;
                    flex-shrink: 0;
                }

                .nav-footer {
                    padding: 10px;
                    border-top: 2px dashed #323232;
                }

                .nav-logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    width: 100%;
                    background: none;
                    border: 2px solid transparent;
                    cursor: pointer;
                    color: #888;
                    font-size: 13px;
                    font-weight: 700;
                    font-family: inherit;
                    transition: all 0.15s;
                    text-align: left;
                }

                .nav-logout-btn:hover {
                    background: #ffecec;
                    border-color: #ff6b6b;
                    color: #c0392b;
                    box-shadow: 2px 2px 0 #c0392b;
                    transform: translate(-1px, -1px);
                }

                /* Mobile bottom nav */
                .mobile-nav-bar {
                    font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive;
                }

                .mobile-nav-link {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    padding: 6px 8px;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    text-decoration: none;
                    border: 2px solid transparent;
                    transition: all 0.15s;
                    color: #aaa;
                    font-size: 9px;
                    font-weight: 700;
                    font-family: inherit;
                }

                .mobile-nav-link:hover {
                    background: #fff9e6;
                    border-color: #323232;
                    box-shadow: 2px 2px 0 #323232;
                }

                .mobile-nav-link.active {
                    background: #ffe66d;
                    border: 2px solid #323232;
                    color: #323232;
                    box-shadow: 2px 2px 0 #323232;
                }

                .mobile-nav-emoji {
                    font-size: 18px;
                    line-height: 1;
                }

                .mobile-logout-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    padding: 6px 8px;
                    background: none;
                    border: 2px solid transparent;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    cursor: pointer;
                    color: #aaa;
                    font-size: 9px;
                    font-weight: 700;
                    font-family: inherit;
                    transition: all 0.15s;
                }

                .mobile-logout-btn:hover {
                    background: #ffecec;
                    border-color: #ff6b6b;
                    color: #c0392b;
                    box-shadow: 2px 2px 0 #c0392b;
                }

                /* Notebook lines bg for sidebar */
                .sidebar-notebook-bg {
                    background-color: #fff9e6;
                    background-image:
                        repeating-linear-gradient(
                            transparent,
                            transparent 27px,
                            rgba(0,0,0,0.06) 27px,
                            rgba(0,0,0,0.06) 29px
                        );
                    background-position: 0 40px;
                }
            `}</style>

            {/* Desktop sidebar */}
            <aside
                className="hidden lg:flex admin-nav-sidebar sidebar-notebook-bg"
                style={{
                    width: '220px',
                    flexShrink: 0,
                    borderRight: '2px solid #323232',
                    minHeight: '100vh',
                    position: 'sticky',
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '4px 0 0 #32323210',
                }}
            >
                {/* Brand */}
                <div className="nav-brand">
                    <div className="nav-brand-inner">
                        <div className="nav-brand-icon">☕</div>
                        <div>
                            <span className="nav-brand-title">Sip & Stay</span>
                            <span className="nav-brand-sub">✏️ Yönetim Paneli</span>
                        </div>
                    </div>
                    {/* Doodle corner squiggle */}
                    <svg
                        style={{ position: 'absolute', top: 8, right: 10, opacity: 0.2 }}
                        width="24" height="24" viewBox="0 0 24 24" fill="none"
                    >
                        <path d="M3 12 C 3 5 10 5 16 5 C 20 5 21 9 18 12 C 15 15 10 13 12 9" stroke="#323232" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </svg>
                </div>

                {/* Nav */}
                <ul className="nav-items-list">
                    {NAV_ITEMS.map(item => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `nav-link-item${isActive ? ' active' : ''}`
                                }
                            >
                                <span className="nav-link-emoji">{item.emoji}</span>
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* Footer */}
                <div className="nav-footer">
                    <button className="nav-logout-btn" onClick={handleLogout}>
                        <LogOut size={14} />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav
                className="lg:hidden mobile-nav-bar"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: '#fff9e6',
                    borderTop: '2px solid #323232',
                    boxShadow: '0 -3px 0 #32323215',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: '6px 4px 8px',
                }}
            >
                {NAV_ITEMS.map(({ to, emoji, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `mobile-nav-link${isActive ? ' active' : ''}`
                        }
                    >
                        <span className="mobile-nav-emoji">{emoji}</span>
                    </NavLink>
                ))}
                <button className="mobile-logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </nav>
        </>
    )
}