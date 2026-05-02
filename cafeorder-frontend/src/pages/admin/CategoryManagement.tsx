import { useState, useEffect, useCallback } from 'react'
import { categoryApi } from '../../api/category.api'
import type { CategoryDto } from '../../types/index'
import { Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

const inputCls =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all'

interface FormState {
    name: string
    displayOrder: string
    isActive: boolean
}

const EMPTY: FormState = { name: '', displayOrder: '0', isActive: true }

function CategoryRow({
    cat,
    onEdit,
    onDelete,
}: {
    cat: CategoryDto
    onEdit: (cat: CategoryDto) => void
    onDelete: (cat: CategoryDto) => void
}) {
    return (
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 group hover:border-zinc-700 transition-colors">
            <GripVertical className="w-4 h-4 text-zinc-700 shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{cat.name}</p>
                    {!cat.isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
                            Pasif
                        </span>
                    )}
                </div>
                <p className="text-xs text-zinc-600 mt-0.5">Sıra: {cat.displayOrder}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(cat)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onDelete(cat)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

interface CategoryFormProps {
    initial?: CategoryDto | null
    onDone: () => void
    onClose: () => void
}

function CategoryForm({ initial, onDone, onClose }: CategoryFormProps) {
    const isEdit = !!initial
    const [form, setForm] = useState<FormState>(
        initial
            ? { name: initial.name, displayOrder: String(initial.displayOrder), isActive: initial.isActive }
            : EMPTY
    )
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const set = (key: keyof FormState, value: string | boolean) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Kategori adı zorunludur.'); return }
        setSaving(true)
        setError(null)
        try {
            if (isEdit && initial) {
                await categoryApi.update(initial.id, {
                    name: form.name.trim(),
                    displayOrder: parseInt(form.displayOrder) || 0,
                    isActive: form.isActive,
                })
                toast.success('Kategori güncellendi.')
            } else {
                await categoryApi.create({
                    name: form.name.trim(),
                    displayOrder: parseInt(form.displayOrder) || 0,
                })
                toast.success('Kategori oluşturuldu.')
            }
            onDone()
        } catch {
            setError('İşlem başarısız.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-base font-bold text-white">{isEdit ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-5 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kategori Adı</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder="Örn: Sıcak İçecekler"
                            className={inputCls}
                            autoFocus
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sıralama</label>
                        <input
                            type="number"
                            value={form.displayOrder}
                            onChange={(e) => set('displayOrder', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    {isEdit && (
                        <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                            <span className="text-sm text-zinc-300">Aktif</span>
                            <button
                                onClick={() => set('isActive', !form.isActive)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-violet-600' : 'bg-zinc-600'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
                <div className="px-5 py-4 border-t border-zinc-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<CategoryDto[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<CategoryDto | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchCategories = useCallback(async () => {
        try {
            const res = await categoryApi.getAll()
            setCategories(res.data.sort((a, b) => a.displayOrder - b.displayOrder))
        } catch {
            toast.error('Kategoriler yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    // ✅ ESLint fix: async wrapper inside useEffect
    useEffect(() => {
        const load = async () => { await fetchCategories() }
        load()
    }, [fetchCategories])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await categoryApi.delete(deleteTarget.id)
            toast.success('Kategori silindi.')
            setDeleteTarget(null)
            fetchCategories()
        } catch {
            toast.error('Silme işlemi başarısız.')
        } finally {
            setDeleting(false)
        }
    }

    const handleFormDone = () => {
        setShowForm(false)
        setEditTarget(null)
        fetchCategories()
    }

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Kategoriler</h1>
                    <p className="text-sm text-zinc-500 mt-1">{categories.length} kategori kayıtlı</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setShowForm(true) }}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Kategori Ekle
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
            ) : categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center text-zinc-600 text-sm">
                    Henüz kategori eklenmemiş.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {categories.map((cat) => (
                        <CategoryRow
                            key={cat.id}
                            cat={cat}
                            onEdit={(c) => { setEditTarget(c); setShowForm(true) }}
                            onDelete={setDeleteTarget}
                        />
                    ))}
                </div>
            )}

            {showForm && (
                <CategoryForm
                    initial={editTarget}
                    onDone={handleFormDone}
                    onClose={() => { setShowForm(false); setEditTarget(null) }}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Kategoriyi Sil?</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            <span className="text-white font-semibold">"{deleteTarget.name}"</span> kategorisi kalıcı olarak silinecek.
                            İçindeki ürünler de etkilenebilir.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 bg-zinc-800 text-white py-2.5 rounded-xl text-sm font-semibold"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                            >
                                {deleting ? 'Siliniyor…' : 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}