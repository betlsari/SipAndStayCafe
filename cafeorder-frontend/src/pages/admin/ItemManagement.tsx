import { useState, useEffect, useCallback } from 'react'
import { menuApi } from '../../api/menu.api'
import { categoryApi } from '../../api/category.api'
import type { MenuItemSummaryDto, CategoryDto } from '../../types/index'
import MenuItemFormModal from '../../components/admin/MenuItemFormModal'
import { Plus, Pencil, Trash2, ImageOff } from 'lucide-react'
import { toast } from 'sonner'

export default function ItemManagement() {
    const [items, setItems] = useState<MenuItemSummaryDto[]>([])
    const [categories, setCategories] = useState<CategoryDto[]>([])
    const [loading, setLoading] = useState(true)
    const [filterCategoryId, setFilterCategoryId] = useState<string>('all')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

    const fetchAll = useCallback(async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                menuApi.getAllItems(),
                categoryApi.getAll(),
            ])
            setItems(itemsRes.data.sort((a, b) => a.displayOrder - b.displayOrder))
            setCategories(catsRes.data)
        } catch {
            toast.error('Veriler yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Schedule fetchAll to run after the initial render to avoid cascading renders
        const id = setTimeout(() => {
            fetchAll()
        }, 0)
        return () => clearTimeout(id)
    }, [fetchAll])
    const handleStockToggle = async (item: MenuItemSummaryDto) => {
        setTogglingId(item.id)
        try {
            await menuApi.updateStock(item.id, { isAvailable: !item.isAvailable })
            setItems((prev) =>
                prev.map((i) => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)
            )
        } catch {
            toast.error('Stok güncellenemedi.')
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu ürünü silmek istediðinize emin misiniz?')) return
        setDeletingId(id)
        try {
            await menuApi.deleteItem(id)
            toast.success('Ürün silindi.')
            setItems((prev) => prev.filter((i) => i.id !== id))
        } catch {
            toast.error('Ürün silinemedi.')
        } finally {
            setDeletingId(null)
        }
    }

    const openCreate = () => { setEditingId(null); setModalOpen(true) }
    const openEdit = (id: string) => { setEditingId(id); setModalOpen(true) }
    const handleSave = async () => {
        setModalOpen(false)
        setEditingId(null)
        await fetchAll()
    }

    const filtered = filterCategoryId === 'all'
        ? items
        : items.filter((i) => i.categoryId === filterCategoryId)

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Ürünler</h1>
                    <p className="text-sm text-zinc-500 mt-1">{filtered.length} ürün</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Ürün
                </button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setFilterCategoryId('all')}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCategoryId === 'all'
                            ? 'bg-violet-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                >
                    Tümü
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilterCategoryId(cat.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCategoryId === cat.id
                                ? 'bg-violet-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-600 text-sm">
                    Bu kategoride ürün yok.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3"
                        >
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageOff className="w-4 h-4 text-zinc-600" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-100 truncate">{item.name}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {categoryMap[item.categoryId] ?? '—'} · #{item.displayOrder}
                                </p>
                            </div>

                            {/* Price */}
                            <span className="text-sm font-bold text-white shrink-0">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.basePrice)}
                            </span>

                            {/* Stock toggle */}
                            <button
                                onClick={() => handleStockToggle(item)}
                                disabled={togglingId === item.id}
                                className={`shrink-0 relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 ${item.isAvailable ? 'bg-emerald-600' : 'bg-zinc-600'
                                    }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => openEdit(item.id)}
                                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    disabled={deletingId === item.id}
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
                <MenuItemFormModal
                    itemId={editingId}
                    categories={categories}
                    onSave={handleSave}
                    onClose={() => { setModalOpen(false); setEditingId(null) }}
                />
            )}
        </div>
    )
}