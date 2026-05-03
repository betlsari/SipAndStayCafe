import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../../api/auth.api'
import { userApi, type UserDto } from '../../api/user.api'
import type { UserRole } from '../../types/index'
import { Trash2, Plus, X, Eye, EyeOff, Crown, ShieldCheck, Users } from 'lucide-react'
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

const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #E0DDD6',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#2C3528',
    background: '#FDFCF9',
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
}

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

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,53,40,0.35)', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '440px', background: '#FDFCF9', borderRadius: '20px', border: '1px solid #E0DDD6', boxShadow: '0 8px 32px rgba(95,113,84,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #EDE9E0' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#2C3528', margin: 0 }}>Yeni Personel Ekle</h2>
                    <button onClick={onClose} style={{ background: '#F0ECE4', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} color="#6A6560" />
                    </button>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                        { key: 'displayName', label: 'Ad Soyad', type: 'text', placeholder: 'Örn: Ahmet Yılmaz' },
                        { key: 'email', label: 'E-posta', type: 'email', placeholder: 'personel@kafe.com' },
                    ].map(field => (
                        <div key={field.key}>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#5F7154', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{field.label}</label>
                            <input
                                type={field.type}
                                value={form[field.key as keyof typeof form] as string}
                                onChange={e => set(field.key as keyof typeof form, e.target.value)}
                                placeholder={field.placeholder}
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = '#82A76B')}
                                onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                            />
                        </div>
                    ))}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#5F7154', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Şifre</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                placeholder="En az 6 karakter"
                                style={{ ...inputStyle, paddingRight: '42px' }}
                                onFocus={e => (e.target.style.borderColor = '#82A76B')}
                                onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex' }}
                            >
                                {showPassword ? <EyeOff size={15} color="#9A8E80" /> : <Eye size={15} color="#9A8E80" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#5F7154', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rol</label>
                        <select
                            value={form.role}
                            onChange={e => setForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                            style={{ ...inputStyle }}
                            onFocus={e => (e.target.style.borderColor = '#82A76B')}
                            onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                        >
                            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    {error && <p style={{ fontSize: '13px', color: '#C06080', background: '#FAE8EE', padding: '10px 12px', borderRadius: '8px', margin: 0 }}>{error}</p>}
                </div>
                <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: '1px solid #E0DDD6', background: '#FFFFFF', fontSize: '13px', fontWeight: 500, color: '#6A6560', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}>İptal</button>
                    <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: 'none', background: saving ? '#8FAF80' : '#5F7154', fontSize: '13px', fontWeight: 500, color: '#FFFFFF', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, sans-serif', transition: 'background 0.15s' }}>
                        {saving ? 'Oluşturuluyor…' : 'Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function UserRow({ user, onDelete, isCurrentUser }: { user: UserDto; onDelete: (user: UserDto) => void; isCurrentUser: boolean }) {
    const [hovered, setHovered] = useState(false)
    const primaryRole = user.roles[0] ?? 'Cashier'
    const cfg = ROLE_CONFIG[primaryRole] ?? ROLE_CONFIG.Cashier
    const Icon = cfg.icon
    const initials = user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: '#FFFFFF',
                border: '1px solid #E8E4DC',
                borderRadius: '14px',
                padding: '13px 16px',
                transition: 'border-color 0.15s',
                borderColor: hovered ? '#C8D5C0' : '#E8E4DC',
            }}
        >
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EDF2E8', border: '1px solid #C8D5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#5F7154' }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C3528', margin: 0 }}>{user.displayName}</p>
                    {isCurrentUser && <span style={{ fontSize: '10px', fontWeight: 600, color: '#9A8E80', background: '#F0ECE4', padding: '2px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Siz</span>}
                </div>
                <p style={{ fontSize: '12px', color: '#9A8E80', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '20px', background: cfg.bg, color: cfg.color }}>
                    <Icon size={11} />
                    {cfg.label}
                </span>
                {!isCurrentUser && (
                    <button
                        onClick={() => onDelete(user)}
                        style={{ padding: '6px', borderRadius: '8px', border: 'none', background: hovered ? '#FAE8EE' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.15s', opacity: hovered ? 1 : 0 }}
                    >
                        <Trash2 size={13} color="#C06080" />
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
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,53,40,0.35)', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '360px', background: '#FDFCF9', borderRadius: '20px', border: '1px solid #E0DDD6', padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', background: '#FAE8EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Trash2 size={22} color="#C06080" />
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3528', margin: '0 0 8px' }}>Emin misiniz?</h2>
                <p style={{ fontSize: '13px', color: '#8A8478', margin: '0 0 22px', lineHeight: 1.5 }}>
                    <strong style={{ color: '#2C3528' }}>{user.displayName}</strong> adlı kullanıcının erişimi kalıcı olarak kaldırılacak.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: '1px solid #E0DDD6', background: '#FFFFFF', fontSize: '13px', fontWeight: 500, color: '#6A6560', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}>Vazgeç</button>
                    <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: 'none', background: deleting ? '#E8B0C0' : '#C06080', fontSize: '13px', fontWeight: 500, color: '#FFFFFF', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, sans-serif' }}>
                        {deleting ? 'Siliniyor…' : 'Evet, Sil'}
                    </button>
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

    return (
        <div style={{ padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '900px', background: '#F7F5F0', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2C3528', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Kullanıcı Yönetimi</h1>
                    <p style={{ fontSize: '13px', color: '#9A8E80', margin: 0 }}>{users.length} personel hesabı kayıtlı</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '12px', border: 'none', background: '#5F7154', color: '#FFFFFF', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'system-ui, sans-serif', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#4A5C40')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#5F7154')}
                >
                    <Plus size={14} />
                    Personel Ekle
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="İsim veya e-posta ara…"
                    style={{ flex: 1, minWidth: '200px', border: '1px solid #E0DDD6', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#2C3528', background: '#FFFFFF', outline: 'none', fontFamily: 'system-ui, sans-serif' }}
                />
                <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    style={{ padding: '10px 14px', border: '1px solid #E0DDD6', borderRadius: '10px', fontSize: '13px', color: '#2C3528', background: '#FFFFFF', outline: 'none', fontFamily: 'system-ui, sans-serif', cursor: 'pointer' }}
                >
                    <option value="all">Tüm Roller</option>
                    <option value="Owner">Sahip</option>
                    <option value="Cashier">Kasiyer</option>
                    <option value="KitchenStaff">Mutfak</option>
                </select>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>☕</div>
                    <p style={{ color: '#9A8E80', fontSize: '13px' }}>Yükleniyor…</p>
                </div>
            ) : error ? (
                <div style={{ background: '#FAE8EE', border: '1px solid #F4C0D0', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#8B3A5A' }}>⚠️ {error}</div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '60px 20px', border: '1.5px dashed #D8D4CC', borderRadius: '16px', textAlign: 'center', color: '#B0AB9E', fontSize: '14px', background: '#FDFCF9' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                                    <Icon size={13} color="#9A8E80" />
                                    <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#9A8E80', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                                        {cfg.label} · {group.length} Personel
                                    </h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
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