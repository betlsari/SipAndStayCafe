import { useState, useEffect, useCallback } from 'react'
import { menuApi } from '../../api/menu.api'
import { categoryApi } from '../../api/category.api'
import type { MenuItemSummaryDto, CategoryDto } from '../../types/index'
import { toast } from 'sonner'
import MenuItemFormModal from '../../components/admin/MenuItemFormModal'

const formatPrice = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

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
        <>
            <style>{`
                .item-page {
                    padding: 32px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    max-width: 900px;
                    min-height: 100vh;
                    background: #FFF5F7;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                }
                .item-page-title {
                    font-size: 26px; font-weight: 900; color: #323232;
                    margin: 0 0 4px; transform: rotate(-1deg);
                    display: inline-block; text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .item-page-sub { font-size: 12px; color: #888; margin: 0; font-style: italic; }
                .item-add-btn {
                    display: flex; align-items: center; gap: 7px;
                    padding: 10px 18px;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    border: 2px solid #323232; background: #ffe66d;
                    color: #323232; font-size: 13px; font-weight: 900;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 4px 4px 0 #323232;
                    transition: all 0.15s; text-transform: uppercase;
                }
                .item-add-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #323232; background: #ffd700; }
                .item-filter-input {
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 9px 14px;
                    font-size: 13px; font-weight: 600;
                    color: #323232; background: #fff;
                    outline: none; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s;
                }
                .item-filter-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    transform: translate(-1px, -1px);
                }
                .item-row {
                    display: flex; align-items: center; gap: 14px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    padding: 12px 16px;
                    transition: all 0.15s;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    box-shadow: 3px 3px 0 #323232;
                }
                .item-row:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 #323232; }
                .item-badge-out {
                    font-size: 10px; font-weight: 700;
                    padding: 2px 8px; border-radius: 20px;
                    background: #ffecec; color: #c0392b;
                    border: 1.5px solid #ff6b6b; font-family: inherit;
                    text-transform: uppercase;
                }
                .item-action-btn {
                    padding: 6px 8px;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    border: 2px solid transparent;
                    cursor: pointer; font-size: 13px;
                    font-family: inherit; background: none;
                    transition: all 0.15s;
                }
                .item-action-btn:hover { border-color: #323232; box-shadow: 2px 2px 0 #323232; transform: translate(-1px,-1px); }
                .item-action-btn.stock:hover { background: #e6fff9; border-color: #4ecdc4; box-shadow: 2px 2px 0 #4ecdc4; }
                .item-action-btn.nostock:hover { background: #fff9e6; }
                .item-action-btn.edit:hover { background: #fff9e6; }
                .item-action-btn.del:hover { background: #ffecec; border-color: #ff6b6b; box-shadow: 2px 2px 0 #ff6b6b; }
                .item-empty {
                    padding: 60px 20px; border: 2px dashed #ccc;
                    border-radius: 16px; text-align: center;
                    color: #aaa; font-size: 14px; font-weight: 700;
                    background: #fffdf5; font-family: inherit;
                }
                .item-delete-overlay {
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(50,50,50,0.45); padding: 16px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .item-delete-box {
                    width: 100%; max-width: 360px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 16px 6px 16px 6px / 6px 16px 6px 16px;
                    box-shadow: 6px 6px 0 #323232;
                    padding: 28px 24px; text-align: center;
                }
                .item-delete-title { font-size: 17px; font-weight: 900; color: #323232; margin: 0 0 8px; text-transform: uppercase; }
                .item-delete-desc { font-size: 13px; color: #666; margin: 0 0 22px; line-height: 1.6; }
                .item-btn-cancel {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #fff;
                    font-size: 13px; font-weight: 700; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .item-btn-cancel:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; }
                .item-btn-del {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #c0392b; background: #ff6b6b;
                    font-size: 13px; font-weight: 900; color: #fff;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #c0392b; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .item-btn-del:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #c0392b; }
                .item-btn-del:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>

            <div className="item-page">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <h1 className="item-page-title">🍽️ Ürünler</h1>
                        <p className="item-page-sub">
                            {items.length} ürün kayıtlı · {items.filter(i => !i.isAvailable).length} stokta yok
                        </p>
                    </div>
                    <button className="item-add-btn" onClick={() => setFormItemId(null)}>
                        + Ürün Ekle
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="🔍 Ürün ara…"
                        className="item-filter-input"
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="item-filter-input"
                        style={{ cursor: 'pointer' }}
                    >
                        <option value="all">Tüm Kategoriler</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
                        <span style={{ fontSize: '36px', animation: 'cat-bounce 1s ease-in-out infinite' }}>☕</span>
                        <p style={{ color: '#888', fontSize: '14px', fontWeight: 700, fontStyle: 'italic' }}>Yükleniyor…</p>
                        <style>{`@keyframes cat-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="item-empty">
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍽️</div>
                        {search || filterCategory !== 'all' ? 'Eşleşen ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map((item) => (
                            <ItemRow
                                key={item.id}
                                item={item}
                                categoryName={getCategoryName(item.categoryId)}
                                toggling={togglingId === item.id}
                                onToggle={() => handleToggleStock(item)}
                                onEdit={() => setFormItemId(item.id)}
                                onDelete={() => setDeleteTarget(item)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {formItemId !== undefined && (
                <MenuItemFormModal
                    itemId={formItemId}
                    categories={categories}
                    onSave={() => { setFormItemId(undefined); fetchAll() }}
                    onClose={() => setFormItemId(undefined)}
                />
            )}

            {deleteTarget && (
                <div className="item-delete-overlay">
                    <div className="item-delete-box">
                        <div style={{ width: '56px', height: '56px', background: '#ffecec', border: '2px solid #ff6b6b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '26px', boxShadow: '3px 3px 0 #ff6b6b' }}>🗑️</div>
                        <h2 className="item-delete-title">Emin misin?</h2>
                        <p className="item-delete-desc">
                            <strong>"{deleteTarget.name}"</strong> kalıcı olarak silinecek.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="item-btn-cancel" onClick={() => setDeleteTarget(null)}>Vazgeç</button>
                            <button className="item-btn-del" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Siliniyor…' : 'Sil! 🗑️'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function ItemRow({
    item,
    categoryName,
    toggling,
    onToggle,
    onEdit,
    onDelete,
}: {
    item: MenuItemSummaryDto
    categoryName: string
    toggling: boolean
    onToggle: () => void
    onEdit: () => void
    onDelete: () => void
}) {
    const [hovered, setHovered] = useState(false)

    return (
        <div
            className="item-row"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ opacity: item.isAvailable ? 1 : 0.65 }}
        >
            {item.imageUrl ? (
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #323232', flexShrink: 0 }}
                />
            ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#ffe66d', border: '2px solid #323232', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🍽️</div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#323232' }}>{item.name}</p>
                    {!item.isAvailable && (
                        <span className="item-badge-out">TÜKENDİ</span>
                    )}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                    {categoryName} · {formatPrice(item.basePrice)}
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, opacity: hovered ? 1 : 0.5, transition: 'opacity 0.15s' }}>
                <button
                    onClick={onToggle}
                    disabled={toggling}
                    className={`item-action-btn ${item.isAvailable ? 'stock' : 'nostock'}`}
                    title={item.isAvailable ? 'Stoktan Kaldır' : 'Stoğa Ekle'}
                >
                    {item.isAvailable ? '✓' : '✕'}
                </button>
                <button onClick={onEdit} className="item-action-btn edit">✏️</button>
                <button onClick={onDelete} className="item-action-btn del">🗑️</button>
            </div>
        </div>
    )
}