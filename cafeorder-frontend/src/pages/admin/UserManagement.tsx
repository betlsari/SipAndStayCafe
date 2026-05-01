import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../../api/auth.api'
import { userApi, type UserDto } from '../../api/user.api'
import type { UserRole } from '../../types/index'
import { Trash2, Plus, X, Eye, EyeOff, ShieldCheck, Users, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'

// ─── Helpers & Config ─────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    Owner: {
        label: 'Sahip',
        cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        icon: Crown,
    },
    Cashier: {
        label: 'Kasiyer',
        cls: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
        icon: ShieldCheck,
    },
    KitchenStaff: {
        label: 'Mutfak',
        cls: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
        icon: Users,
    },
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'Owner', label: 'Sahip (Owner)' },
    { value: 'Cashier', label: 'Kasiyer (Cashier)' },
    { value: 'KitchenStaff', label: 'Mutfak Personeli (KitchenStaff)' },
]

// ─── Create Staff Modal ───────────────────────────────────────────────────────

interface CreateModalProps {
    onClose: () => void
    onCreated: () => void
}

function CreateStaffModal({ onClose, onCreated }: CreateModalProps) {
    const [form, setForm] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'Cashier' as UserRole,
    })
    const [showPassword, setShowPassword] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const set = (key: keyof typeof form, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const handleSubmit = async () => {
        if (!form.email.trim()) { setError('E-posta zorunludur.'); return }
        if (!form.password || form.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.')
            return
        }
        if (!form.displayName.trim()) { setError('Ad zorunludur.'); return }

        setSaving(true)
        setError(null)
        try {
            await authApi.registerStaff({
                email: form.email.trim(),
                password: form.password,
                displayName: form.displayName.trim(),
                role: form.role,
            })
            toast.success('Personel hesabı oluşturuldu.')
            onCreated()
        } catch (err: unknown) {
            // ✅ any yerine unknown kullanılarak tip güvenliği sağlandı
            const axErr = err as { response?: { data?: { message?: string } } }
            setError(axErr?.response?.data?.message ?? 'Hesap oluşturulamadı.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-base font-bold text-white">Yeni Personel Ekle</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-5 flex flex-col gap-4">
                    <Field label="Ad Soyad">
                        <input
                            type="text"
                            value={form.displayName}
                            onChange={(e) => set('displayName', e.target.value)}
                            placeholder="Örn: Ahmet Yılmaz"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="E-posta">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => set('email', e.target.value)}
                            placeholder="personel@kafe.com"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Şifre">
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => set('password', e.target.value)}
                                placeholder="En az 6 karakter"
                                className={`${inputCls} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </Field>

                    <Field label="Rol">
                        <select
                            value={form.role}
                            onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                            className={inputCls}
                        >
                            {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                            {error}
                        </p>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-zinc-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-2.5 rounded-xl transition-colors">
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-violet-900/20"
                    >
                        {saving ? 'Oluşturuluyor…' : 'Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
    user,
    onDelete,
    isCurrentUser,
}: {
    user: UserDto
    onDelete: (user: UserDto) => void
    isCurrentUser: boolean
}) {
    const primaryRole = user.roles[0] ?? 'Cashier'
    const cfg = ROLE_CONFIG[primaryRole] ?? ROLE_CONFIG.Cashier
    const Icon = cfg.icon

    const initials = user.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-violet-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                    {isCurrentUser && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">Siz</span>
                    )}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.cls}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                </span>
            </div>
            {!isCurrentUser && (
                <button
                    onClick={() => onDelete(user)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors md:opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserManagement() {
    const [users, setUsers] = useState<UserDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState<string>('all')

    const currentUserId = useAuthStore((s) => s.user?.userId ?? null)

    // ✅ fetchUsers: err: any hatası düzeltildi
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

    // ✅ useEffect: Cascading renders uyarısı giderildi
    useEffect(() => {
        let isMounted = true

        const load = async () => {
            if (isMounted) {
                await fetchUsers()
            }
        }

        load()
        return () => { isMounted = false }
    }, [fetchUsers])

    const filtered = users.filter((u) => {
        const matchSearch =
            u.displayName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        const matchRole = filterRole === 'all' || u.roles.includes(filterRole)
        return matchSearch && matchRole
    })

    const grouped = {
        Owner: filtered.filter((u) => u.roles.includes('Owner')),
        Cashier: filtered.filter((u) => u.roles.includes('Cashier') && !u.roles.includes('Owner')),
        KitchenStaff: filtered.filter(
            (u) => u.roles.includes('KitchenStaff') && !u.roles.includes('Owner') && !u.roles.includes('Cashier')
        ),
    }

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Kullanıcı Yönetimi</h1>
                    <p className="text-sm text-zinc-500 mt-1">{users.length} personel hesabı kayıtlı</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0 shadow-lg shadow-violet-900/20"
                >
                    <Plus className="w-4 h-4" />
                    Personel Ekle
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="İsim veya e-posta ara…"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                >
                    <option value="all">Tüm Roller</option>
                    <option value="Owner">Sahip</option>
                    <option value="Cashier">Kasiyer</option>
                    <option value="KitchenStaff">Mutfak</option>
                </select>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-500 text-sm italic">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                    Yükleniyor…
                </div>
            ) : error ? (
                <div className="bg-red-900/20 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 text-sm flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center text-zinc-600 text-sm">
                    {search || filterRole !== 'all' ? 'Eşleşen kullanıcı bulunamadı.' : 'Henüz personel hesabı oluşturulmamış.'}
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {(['Owner', 'Cashier', 'KitchenStaff'] as const).map((role) => {
                        const group = grouped[role]
                        if (group.length === 0) return null
                        const cfg = ROLE_CONFIG[role]
                        const Icon = cfg.icon

                        return (
                            <section key={role} className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Icon className="w-3.5 h-3.5 text-zinc-500" />
                                    <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                        {cfg.label} <span className="text-zinc-700 mx-1">/</span> {group.length} PERSONEL
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {group.map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            onDelete={setDeleteTarget}
                                            isCurrentUser={user.id === currentUserId}
                                        />
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>
            )}

            {showCreateModal && (
                <CreateStaffModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false)
                        fetchUsers()
                    }}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    user={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={() => {
                        setDeleteTarget(null)
                        fetchUsers()
                    }}
                />
            )}
        </div>
    )
}

// ─── Delete Modal Component ───────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: { user: UserDto, onClose: () => void, onDeleted: () => void }) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Emin misiniz?</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    <span className="text-white font-semibold">{user.displayName}</span> adlı kullanıcının erişimi kalıcı olarak kaldırılacak.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-zinc-800 text-white py-2.5 rounded-xl text-sm font-semibold">Vazgeç</button>
                    <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                        {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const inputCls =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
            {children}
        </div>
    )
}