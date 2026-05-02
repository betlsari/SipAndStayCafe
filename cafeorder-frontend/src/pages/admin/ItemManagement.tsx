import { useState, useEffect, useCallback } from 'react'
import { menuApi } from '../../api/menu.api'
import { categoryApi } from '../../api/category.api'
import type { MenuItemSummaryDto, CategoryDto } from '../../types/index'
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import MenuItemFormModal from '../../components/admin/MenuItemFormModal'

export default function ItemManagement() {
    const [items, setItems] = useState<MenuItemSummaryDto[]>([])
    const [categories, setCategories] = useState<CategoryDto[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [formItemId, setFormItemId] = useState<string | null | undefined>(undefined)
    const [deleteTarget, setDeleteTarget] = useState<MenuItemSummaryDto | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        try {
            const [itemsRes, catRes] = await Promise.all([
                menuApi.getAllItems(),
                categoryApi.getAll(),
            ])
            setItems(itemsRes.data.sort((a, b) => a.displayOrder - b.displayOrder))
            setCategories(catRes.data)
        } catch {
            toast.error('Ürünler yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    // ✅ ESLint fix: async wrapper inside useEffect
    useEffect(() => {
        const load = async () => { await fetchAll() }
        load()
    }, [fetchAll])

    const handleToggleStock = async (item: MenuItemSummaryDto) => {
        setTogglingId(item.id)
        try {
            await menuApi.updateStock(item.id, { isAvailable: !item.isAvailable })
            setItems((prev) =>
                prev.map((i) => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)
            )
            toast.success(item.isAvailable ? 'Ürün stoktan kaldırıldı.' : 'Ürün stoğa eklendi.')
        } catch {
            toast.error('Stok güncellenemedi.')
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await menuApi.deleteItem(deleteTarget.id)
            toast.success('Ürün silindi.')
            setDeleteTarget(null)
            fetchAll()
        } catch {
            toast.error('Silme işlemi başarısız.')
        } finally {
            setDeleting(false)
        }
    }

    const getCategoryName = (id: string) =>
        categories.find((c) => c.id === id)?.name ?? '—'

    const filtered = items.filter((item) => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = filterCategory === 'all' || item.categoryId === filterCategory
        return matchSearch && matchCat
    })

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Ürünler</h1>
                    <p className="text-sm text-zinc-500 mt-1">{items.length} ürün kayıtlı</p>
                </div>
                <button
                    onClick={() => setFormItemId(null)}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Ürün Ekle
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ürün ara…"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                    <option value="all">Tüm Kategoriler</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center text-zinc-600 text-sm">
                    {search || filterCategory !== 'all' ? 'Eşleşen ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 group hover:border-zinc-700 transition-colors"
                        >
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-600 text-xs">
                                    —
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                    {!item.isAvailable && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                            Stokta Yok
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {getCategoryName(item.categoryId)} · ₺{item.basePrice.toFixed(2)}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleToggleStock(item)}
                                    disabled={togglingId === item.id}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                                    title={item.isAvailable ? 'Stoktan Kaldır' : 'Stoğa Ekle'}
                                >
                                    {item.isAvailable
                                        ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                                        : <ToggleLeft className="w-4 h-4" />
                                    }
                                </button>
                                <button
                                    onClick={() => setFormItemId(item.id)}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(item)}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {formItemId !== undefined && (
                <MenuItemFormModal
                    itemId={formItemId}
                    categories={categories}
                    onSave={() => { setFormItemId(undefined); fetchAll() }}
                    onClose={() => setFormItemId(undefined)}
                />
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Ürünü Sil?</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            <span className="text-white font-semibold">"{deleteTarget.name}"</span> kalıcı olarak silinecek.
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