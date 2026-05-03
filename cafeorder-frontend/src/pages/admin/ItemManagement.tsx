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
        <div style={{
            padding: '32px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            maxWidth: '900px',
            background: '#F7F5F0',
            minHeight: '100vh',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2C3528', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                        Ürünler
                    </h1>
                    <p style={{ fontSize: '13px', color: '#9A8E80', margin: 0 }}>
                        {items.length} ürün kayıtlı · {items.filter(i => !i.isAvailable).length} stokta yok
                    </p>
                </div>
                <button
                    onClick={() => setFormItemId(null)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#5F7154',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'system-ui, sans-serif',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#4A5C40')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#5F7154')}
                >
                    + Ürün Ekle
                </button>
            </div>

            {/* Filtreler */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#B0AB9E',
                        fontSize: '14px',
                        pointerEvents: 'none',
                    }}>🔍</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ürün ara…"
                        style={{
                            width: '100%',
                            border: '1px solid #E0DDD6',
                            borderRadius: '10px',
                            padding: '10px 14px 10px 36px',
                            fontSize: '13px',
                            color: '#2C3528',
                            background: '#FFFFFF',
                            outline: 'none',
                            fontFamily: 'system-ui, sans-serif',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#82A76B')}
                        onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{
                        border: '1px solid #E0DDD6',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: '#2C3528',
                        background: '#FFFFFF',
                        outline: 'none',
                        fontFamily: 'system-ui, sans-serif',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#82A76B')}
                    onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                >
                    <option value="all">Tüm Kategoriler</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Liste */}
            {loading ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    gap: '12px',
                }}>
                    <div style={{ fontSize: '28px' }}>☕</div>
                    <p style={{ color: '#9A8E80', fontSize: '13px', margin: 0 }}>Yükleniyor…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    padding: '60px 20px',
                    border: '1.5px dashed #D8D4CC',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: '#B0AB9E',
                    fontSize: '14px',
                    background: '#FDFCF9',
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍽️</div>
                    {search || filterCategory !== 'all'
                        ? 'Eşleşen ürün bulunamadı.'
                        : 'Henüz ürün eklenmemiş.'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

            {/* Form Modal */}
            {formItemId !== undefined && (
                <MenuItemFormModal
                    itemId={formItemId}
                    categories={categories}
                    onSave={() => { setFormItemId(undefined); fetchAll() }}
                    onClose={() => setFormItemId(undefined)}
                />
            )}

            {/* Silme Modal */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(44,53,40,0.35)',
                    padding: '16px',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '360px',
                        background: '#FDFCF9',
                        borderRadius: '20px',
                        border: '1px solid #E0DDD6',
                        padding: '28px 24px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            background: '#FAE8EE',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '22px',
                        }}>🗑️</div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3528', margin: '0 0 8px' }}>
                            Ürünü Sil?
                        </h2>
                        <p style={{ fontSize: '13px', color: '#8A8478', margin: '0 0 22px', lineHeight: 1.5 }}>
                            <strong style={{ color: '#2C3528' }}>"{deleteTarget.name}"</strong> kalıcı olarak silinecek.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '11px',
                                    border: '1px solid #E0DDD6', background: '#FFFFFF',
                                    fontSize: '13px', fontWeight: 500, color: '#6A6560',
                                    cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                                }}
                            >Vazgeç</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '11px',
                                    border: 'none',
                                    background: deleting ? '#E8B0C0' : '#C06080',
                                    fontSize: '13px', fontWeight: 500, color: '#FFFFFF',
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    fontFamily: 'system-ui, sans-serif',
                                }}
                            >{deleting ? 'Siliniyor…' : 'Sil'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
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
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: '#FFFFFF',
                border: '1px solid #E8E4DC',
                borderColor: hovered ? '#C8D5C0' : '#E8E4DC',
                borderRadius: '14px',
                padding: '12px 16px',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: hovered ? '0 2px 8px rgba(95,113,84,0.08)' : 'none',
            }}
        >
            {/* Görsel */}
            {item.imageUrl ? (
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        opacity: item.isAvailable ? 1 : 0.5,
                    }}
                />
            ) : (
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#F0F4EC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    opacity: item.isAvailable ? 1 : 0.5,
                }}>🍽️</div>
            )}

            {/* İçerik */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 500,
                        color: item.isAvailable ? '#2C3528' : '#9A8E80',
                    }}>{item.name}</p>
                    {!item.isAvailable && (
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '20px',
                            background: '#FAE8EE',
                            color: '#A0536A',
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.04em',
                        }}>Stokta Yok</span>
                    )}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9A8E80' }}>
                    {categoryName} · {formatPrice(item.basePrice)}
                </p>
            </div>

            {/* Aksiyonlar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                opacity: hovered ? 1 : 0.6,
                transition: 'opacity 0.15s',
            }}>
                {/* Stok toggle */}
                <button
                    onClick={onToggle}
                    disabled={toggling}
                    title={item.isAvailable ? 'Stoktan Kaldır' : 'Stoğa Ekle'}
                    style={{
                        padding: '7px',
                        borderRadius: '8px',
                        border: 'none',
                        background: item.isAvailable ? '#EDF2E8' : '#F0ECE4',
                        cursor: toggling ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        transition: 'background 0.15s',
                        opacity: toggling ? 0.5 : 1,
                    }}
                >
                    {item.isAvailable ? '✓' : '✕'}
                </button>

                {/* Düzenle */}
                <button
                    onClick={onEdit}
                    title="Düzenle"
                    style={{
                        padding: '7px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#F0F4EC',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                    }}
                >✏️</button>

                {/* Sil */}
                <button
                    onClick={onDelete}
                    title="Sil"
                    style={{
                        padding: '7px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#FAE8EE',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                    }}
                >🗑️</button>
            </div>
        </div>
    )
}