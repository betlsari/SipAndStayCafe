import { useState, useEffect, useCallback } from 'react'
import { categoryApi } from '../../api/category.api'
import type { CategoryDto } from '../../types/index'
import CategoryFormModal from '../../components/admin/CategoryFormModal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CategoryManagement() {
    const [categories, setCategories] = useState<CategoryDto[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<CategoryDto | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetch = useCallback(async () => {
        try {
            const res = await categoryApi.getAll()
            setCategories(res.data.sort((a, b) => a.displayOrder - b.displayOrder))
        } catch {
            toast.error('Kategoriler yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Call fetch inside an async IIFE to avoid calling setState synchronously
        (async () => {
            await fetch()
        })()
    }, [fetch])

    const handleSave = async () => {
        setModalOpen(false)
        setEditing(null)
        await fetch()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kategoriyi silmek istediðinize emin misiniz?')) return
        setDeletingId(id)
        try {
            await categoryApi.delete(id)
            toast.success('Kategori silindi.')
            setCategories((prev) => prev.filter((c) => c.id !== id))
        } catch {
            toast.error('Kategori silinemedi.')
        } finally {
            setDeletingId(null)
        }
    }

    const openCreate = () => { setEditing(null); setModalOpen(true) }
    const openEdit = (cat: CategoryDto) => { setEditing(cat); setModalOpen(true) }

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Kategoriler</h1>
                    <p className="text-sm text-zinc-500 mt-1">{categories.length} kategori</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Kategori
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
            ) : categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-600 text-sm">
                    Henüz kategori yok. Yeni bir tane oluþturun.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-4"
                        >
                            <span className="text-xs font-mono text-zinc-600 w-6 text-center">{cat.displayOrder}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-100">{cat.name}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.isActive
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-zinc-700 text-zinc-400'
                                }`}>
                                {cat.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => openEdit(cat)}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    disabled={deletingId === cat.id}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-40"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <CategoryFormModal
                    category={editing}
                    onSave={handleSave}
                    onClose={() => { setModalOpen(false); setEditing(null) }}
                />
            )}
        </div>
    )
}