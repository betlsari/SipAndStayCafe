import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../../api/auth.api'
import { userApi, type UserDto } from '../../api/user.api'
import type { UserRole } from '../../types/index'
import { Trash2, Plus,  Eye, EyeOff, Crown, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
    Owner: { label: 'Sahip', bg: '#FEF6EE', color: '#A05C1A', icon: Crown },
    Cashier: { label: 'Kasiyer', bg: '#EDF2E8', color: '#3D5C34', icon: ShieldCheck },
    KitchenStaff: { label: 'Mutfak', bg: '#EEF4FE', color: '#2B5FA0', icon: Users },
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'Owner', label: 'Sahip (Owner)' },
    { value: 'Cashier', label: 'Kasiyer (Cashier)' },
    { value: 'KitchenStaff', label: 'Mutfak Personeli (KitchenStaff)' },
]

// inputStyle sabitini değiştir
const inputCls = 'um-input'



function CreateStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'Cashier' as UserRole })
    const [showPassword, setShowPassword] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const set = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }))

    const handleSubmit = async () => {
        if (!form.email.trim()) { setError('E-posta zorunludur.'); return }
        if (!form.password || form.password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return }
        if (!form.displayName.trim()) { setError('Ad zorunludur.'); return }
        setSaving(true)
        setError(null)
        try {
            await authApi.registerStaff({ email: form.email.trim(), password: form.password, displayName: form.displayName.trim(), role: form.role })
            toast.success('Personel hesabı oluşturuldu.')
            onCreated()
        } catch (err: unknown) {
            const axErr = err as { response?: { data?: { message?: string } } }
            setError(axErr?.response?.data?.message ?? 'Hesap oluşturulamadı.')
        } finally {
            setSaving(false)
        }
    }

    // CreateStaffModal return bloğunu tamamen değiştir
    return (
        <>
            <style>{`
                .um-overlay {
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(50,50,50,0.45); padding: 16px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .um-box {
                    width: 100%; max-width: 440px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 16px 6px 16px 6px / 6px 16px 6px 16px;
                    box-shadow: 6px 6px 0 #323232;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                    background-position: 0 40px;
                }
                .um-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 18px 20px; border-bottom: 2px dashed #323232;
                }
                .um-title {
                    font-size: 15px; font-weight: 900; color: #323232;
                    margin: 0; text-transform: uppercase;
                    transform: rotate(-1deg); display: inline-block;
                }
                .um-close {
                    background: #ff6b6b; border: 2px solid #323232;
                    border-radius: 50%; width: 30px; height: 30px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: 2px 2px 0 #323232; transition: all 0.15s;
                    color: white; font-size: 14px; font-weight: bold;
                }
                .um-close:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #323232; }
                .um-input {
                    width: 100%; box-sizing: border-box;
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 10px 14px;
                    font-size: 14px; font-weight: 600;
                    color: #323232; background: #ffffff;
                    outline: none;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .um-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    background: #fffdf5; transform: translate(-1px,-1px);
                }
                .um-field-label {
                    font-size: 11px; font-weight: 700; color: #5F7154;
                    display: block; margin-bottom: 6px;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    font-family: inherit;
                }
                .um-btn-cancel {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffffff;
                    font-size: 13px; font-weight: 700; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .um-btn-cancel:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; }
                .um-btn-save {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffe66d;
                    font-size: 13px; font-weight: 900; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .um-btn-save:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; background: #ffd700; }
                .um-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
                .um-btn-del {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #c0392b; background: #ff6b6b;
                    font-size: 13px; font-weight: 900; color: #fff;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #c0392b; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .um-btn-del:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #c0392b; }
                .um-btn-del:disabled { opacity: 0.6; cursor: not-allowed; }
                .um-error {
                    font-size: 12px; font-weight: 700; color: #c0392b;
                    background: #ffecec; padding: 10px 12px;
                    border-radius: 8px; border: 2px solid #ff6b6b;
                    box-shadow: 2px 2px 0 #ff6b6b; margin: 0; font-family: inherit;
                }
                .um-user-row {
                    display: flex; align-items: center; gap: 14px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    padding: 12px 16px;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .um-user-row:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #323232; }
                .um-avatar {
                    width: 40px; height: 40px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; box-shadow: 2px 2px 0 #323232;
                }
                .um-role-badge {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 11px; font-weight: 700;
                    padding: 4px 10px; border-radius: 20px;
                    border: 1.5px solid #323232;
                    font-family: inherit;
                }
                .um-you-badge {
                    font-size: 10px; font-weight: 700; color: #888;
                    background: #f0ece4; padding: 2px 7px;
                    border-radius: 20px; border: 1.5px solid #ccc;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    font-family: inherit;
                }
                .um-action-btn {
                    padding: 6px; border-radius: 6px 2px 6px 2px / 2px 6px 2px 6px;
                    border: 2px solid transparent; background: none;
                    cursor: pointer; display: flex; align-items: center;
                    transition: all 0.15s;
                }
                .um-action-btn:hover { background: #ffecec; border-color: #ff6b6b; box-shadow: 2px 2px 0 #ff6b6b; transform: translate(-1px,-1px); }
                .um-section-title {
                    display: flex; align-items: center; gap: 7px;
                    font-size: 11px; font-weight: 700; color: #888;
                    text-transform: uppercase; letter-spacing: 0.1em;
                    margin: 0 0 12px; font-family: "Comic Sans MS", cursive;
                }
                .um-filter-input {
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 10px 14px;
                    font-size: 13px; font-weight: 600;
                    color: #323232; background: #ffffff;
                    outline: none;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .um-filter-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    background: #fffdf5; transform: translate(-1px,-1px);
                }
            `}</style>
            <div className="um-overlay">
                <div className="um-box">
                    <div className="um-header">
                        <h2 className="um-title">✨ Yeni Personel</h2>
                        <button className="um-close" onClick={onClose}>✕</button>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[
                            { key: 'displayName', label: 'Ad Soyad', type: 'text', placeholder: 'Örn: Ahmet Yılmaz' },
                            { key: 'email', label: 'E-posta', type: 'email', placeholder: 'personel@kafe.com' },
                        ].map(field => (
                            <div key={field.key}>
                                <label className="um-field-label">{field.label}</label>
                                <input
                                    type={field.type}
                                    value={form[field.key as keyof typeof form] as string}
                                    onChange={e => set(field.key as keyof typeof form, e.target.value)}
                                    placeholder={field.placeholder}
                                    className={inputCls}
                                />
                            </div>
                        ))}
                        <div>
                            <label className="um-field-label">Şifre</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    placeholder="En az 6 karakter"
                                    className={inputCls}
                                    style={{ paddingRight: '44px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                                >
                                    {showPassword ? <EyeOff size={15} color="#888" /> : <Eye size={15} color="#888" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="um-field-label">Rol</label>
                            <select
                                value={form.role}
                                onChange={e => setForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                                className={inputCls}
                            >
                                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        {error && <p className="um-error">⚠️ {error}</p>}
                    </div>
                    <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
                        <button className="um-btn-cancel" onClick={onClose}>İptal</button>
                        <button className="um-btn-save" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Oluşturuluyor…' : 'Oluştur ✓'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// UserRow bileşenini tamamen değiştir
function UserRow({ user, onDelete, isCurrentUser }: { user: UserDto; onDelete: (user: UserDto) => void; isCurrentUser: boolean }) {
    const [hovered, setHovered] = useState(false)
    const primaryRole = user.roles[0] ?? 'Cashier'
    const cfg = ROLE_CONFIG[primaryRole] ?? ROLE_CONFIG.Cashier
    const Icon = cfg.icon
    const initials = user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div
            className="um-user-row"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="um-avatar" style={{ background: cfg.bg }}>
                <span style={{ fontSize: '13px', fontWeight: 900, color: cfg.color }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#323232', margin: 0 }}>{user.displayName}</p>
                    {isCurrentUser && <span className="um-you-badge">Siz</span>}
                </div>
                <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{user.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span className="um-role-badge" style={{ background: cfg.bg, color: cfg.color }}>
                    <Icon size={11} />
                    {cfg.label}
                </span>
                {!isCurrentUser && (
                    <button
                        onClick={() => onDelete(user)}
                        className="um-action-btn"
                        style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s, all 0.15s' }}
                    >
                        <Trash2 size={13} color="#c0392b" />
                    </button>
                )}
            </div>
        </div>
    )
}

function DeleteModal({ user, onClose, onDeleted }: { user: UserDto; onClose: () => void; onDeleted: () => void }) {
    const [deleting, setDeleting] = useState(false)
    const handleDelete = async () => {
        setDeleting(true)
        try {
            await userApi.deleteUser(user.id)
            toast.success('Kullanıcı silindi.')
            onDeleted()
        } catch {
            toast.error('Silme işlemi başarısız oldu.')
        } finally {
            setDeleting(false)
        }
    }
    // DeleteModal return bloğunu tamamen değiştir
    return (
        <div className="um-overlay">
            <div className="um-box" style={{ maxWidth: '360px' }}>
                <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', background: '#ffecec', border: '2px solid #ff6b6b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '26px', boxShadow: '3px 3px 0 #ff6b6b' }}>🗑️</div>
                    <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#323232', margin: '0 0 8px', textTransform: 'uppercase', fontFamily: '"Comic Sans MS", cursive' }}>Emin misin?</h2>
                    <p style={{ fontSize: '13px', color: '#666', margin: '0 0 22px', lineHeight: 1.6, fontFamily: '"Comic Sans MS", cursive' }}>
                        <strong style={{ color: '#323232' }}>{user.displayName}</strong> adlı kullanıcının erişimi kalıcı olarak kaldırılacak.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="um-btn-cancel" onClick={onClose}>Vazgeç</button>
                        <button className="um-btn-del" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Siliniyor…' : 'Sil! 🗑️'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState<string>('all')
    const currentUserId = useAuthStore(s => s.user?.userId ?? null)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await userApi.getAllUsers()
            setUsers(res.data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let isMounted = true
        const load = async () => { if (isMounted) await fetchUsers() }
        load()
        return () => { isMounted = false }
    }, [fetchUsers])

    const filtered = users.filter(u => {
        const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
        const matchRole = filterRole === 'all' || u.roles.includes(filterRole)
        return matchSearch && matchRole
    })

    const grouped = {
        Owner: filtered.filter(u => u.roles.includes('Owner')),
        Cashier: filtered.filter(u => u.roles.includes('Cashier') && !u.roles.includes('Owner')),
        KitchenStaff: filtered.filter(u => u.roles.includes('KitchenStaff') && !u.roles.includes('Owner') && !u.roles.includes('Cashier')),
    }

    // UserManagement return bloğunu tamamen değiştir
    return (
        <div style={{
            padding: '32px',
            fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
            maxWidth: '900px', minHeight: '100vh',
            background: '#FFF5F7',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px)',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#323232', margin: '0 0 4px', transform: 'rotate(-1deg)', display: 'inline-block', textTransform: 'uppercase' }}>
                        👥 Kullanıcılar
                    </h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0, fontStyle: 'italic' }}>{users.length} personel hesabı kayıtlı</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '10px 18px',
                        borderRadius: '12px 4px 12px 4px / 4px 12px 4px 12px',
                        border: '2px solid #323232', background: '#ffe66d',
                        color: '#323232', fontSize: '13px', fontWeight: 900,
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '4px 4px 0 #323232', transition: 'all 0.15s',
                        textTransform: 'uppercase',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #323232' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #323232' }}
                >
                    <Plus size={15} /> Personel Ekle
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 İsim veya e-posta ara…"
                    className="um-filter-input"
                    style={{ flex: 1, minWidth: '200px' }}
                />
                <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="um-filter-input"
                    style={{ cursor: 'pointer' }}
                >
                    <option value="all">Tüm Roller</option>
                    <option value="Owner">Sahip</option>
                    <option value="Cashier">Kasiyer</option>
                    <option value="KitchenStaff">Mutfak</option>
                </select>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
                    <span style={{ fontSize: '36px', animation: 'cat-bounce 1s ease-in-out infinite' }}>☕</span>
                    <p style={{ color: '#888', fontSize: '14px', fontWeight: 700, fontStyle: 'italic' }}>Yükleniyor…</p>
                    <style>{`@keyframes cat-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
                </div>
            ) : error ? (
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#c0392b', background: '#ffecec', padding: '12px 16px', borderRadius: '8px', border: '2px solid #ff6b6b', boxShadow: '2px 2px 0 #ff6b6b', fontFamily: 'inherit' }}>⚠️ {error}</p>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '60px 20px', border: '2px dashed #ccc', borderRadius: '16px', textAlign: 'center', color: '#aaa', fontSize: '14px', fontWeight: 700, background: '#fffdf5' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                    {search || filterRole !== 'all' ? 'Eşleşen kullanıcı bulunamadı.' : 'Henüz personel hesabı oluşturulmamış.'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {(['Owner', 'Cashier', 'KitchenStaff'] as const).map(role => {
                        const group = grouped[role]
                        if (group.length === 0) return null
                        const cfg = ROLE_CONFIG[role]
                        const Icon = cfg.icon
                        return (
                            <section key={role}>
                                <div className="um-section-title">
                                    <Icon size={13} />
                                    {cfg.label} · {group.length} Personel
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                                    {group.map(user => (
                                        <UserRow key={user.id} user={user} onDelete={setDeleteTarget} isCurrentUser={user.id === currentUserId} />
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>
            )}

            {showCreateModal && (
                <CreateStaffModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchUsers() }} />
            )}
            {deleteTarget && (
                <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => { setDeleteTarget(null); fetchUsers() }} />
            )}
        </div>
    )
}