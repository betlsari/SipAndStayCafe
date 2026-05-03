import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { menuApi } from '../../api/menu.api'
import { useCartStore } from '../../store/cartStore'
import type { MenuCategoryDto, MenuItemDto } from '../../types/index'
import ModifierModal from '../../components/customer/ModifierModal'
import CartDrawer from '../../components/customer/CartDrawer'

export default function Menu() {
    const [searchParams] = useSearchParams()
    const tableNumber = Number(searchParams.get('table'))

    const { setTable, getTotalCount } = useCartStore()

    const [categories, setCategories] = useState<MenuCategoryDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedItem, setSelectedItem] = useState<MenuItemDto | null>(null)
    const [cartOpen, setCartOpen] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)

    useEffect(() => {
        if (tableNumber) setTable(tableNumber)
    }, [tableNumber, setTable])

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await menuApi.getPublicMenu()
                setCategories(res.data)
                if (res.data.length > 0) setActiveCategory(res.data[0].id)
            } catch {
                setError('Menü yüklenemedi.')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>☕</div>
            <p style={{ color: '#8A8478', fontSize: '14px', fontWeight: 500 }}>Menü hazırlanıyor…</p>
        </div>
    )

    if (error) return (
        <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#C0392B', fontSize: '14px' }}>{error}</p>
        </div>
    )

    const activeItems = categories.find(c => c.id === activeCategory)?.items ?? []
    const cartCount = getTotalCount()

    return (
        <div style={{ minHeight: '100vh', background: '#F7F5F0', paddingBottom: '100px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: 'rgba(247,245,240,0.92)', backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #E8E4DC',
                padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#2C3528', margin: 0, letterSpacing: '-0.01em' }}>Sip & Stay</h1>
                    {tableNumber > 0 && (
                        <p style={{ fontSize: '12px', color: '#8A8478', margin: '1px 0 0', letterSpacing: '0.02em' }}>Masa {tableNumber}</p>
                    )}
                </div>
                <button
                    onClick={() => setCartOpen(true)}
                    style={{
                        position: 'relative',
                        background: cartCount > 0 ? '#5F7154' : '#fff',
                        color: cartCount > 0 ? '#fff' : '#5F7154',
                        border: cartCount > 0 ? 'none' : '1.5px solid #82A76B',
                        borderRadius: '22px', padding: '8px 18px',
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                >
                    <span>Sepet</span>
                    {cartCount > 0 && (
                        <span style={{
                            background: '#FDB5CE', color: '#7A2E4A',
                            borderRadius: '50%', width: '20px', height: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700,
                        }}>{cartCount}</span>
                    )}
                </button>
            </div>

            {/* Category Tabs */}
            <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto',
                padding: '14px 20px', background: '#fff',
                borderBottom: '1px solid #E8E4DC',
                scrollbarWidth: 'none',
            }}>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            flexShrink: 0,
                            padding: '6px 16px',
                            borderRadius: '22px',
                            fontSize: '13px', fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            border: activeCategory === cat.id ? 'none' : '1px solid #C8D5C0',
                            background: activeCategory === cat.id ? '#5F7154' : '#F7F5F0',
                            color: activeCategory === cat.id ? '#fff' : '#5F7154',
                        }}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Items */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
                {activeItems.map((item) => {
                    const unavailable = !item.isAvailable
                    return (
                        <button
                            key={item.id}
                            onClick={() => !unavailable && setSelectedItem(item)}
                            disabled={unavailable}
                            style={{
                                width: '100%', textAlign: 'left',
                                background: '#fff',
                                borderRadius: '16px',
                                border: '1px solid #E8E4DC',
                                padding: '14px',
                                display: 'flex', alignItems: 'center', gap: '14px',
                                cursor: unavailable ? 'not-allowed' : 'pointer',
                                opacity: unavailable ? 0.65 : 1,
                                transition: 'all 0.15s',
                            }}
                        >
                            {/* Image / placeholder */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        style={{
                                            width: '72px', height: '72px',
                                            borderRadius: '12px',
                                            objectFit: 'cover',
                                            filter: unavailable ? 'grayscale(0.6)' : 'none',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '72px', height: '72px',
                                        borderRadius: '12px',
                                        background: '#EDF0E8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '28px',
                                    }}>☕</div>
                                )}
                                {unavailable && (
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        borderRadius: '12px',
                                        background: 'rgba(240,237,230,0.7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#9A8070', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', lineHeight: 1.3 }}>Tükendi</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: unavailable ? '#9A9590' : '#2C3528', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.name}
                                </p>
                                {item.description && (
                                    <p style={{ fontSize: '12px', color: '#9A8E80', margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.description}
                                    </p>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    {unavailable ? (
                                        <span style={{ fontSize: '12px', background: '#FAE8EE', color: '#A0536A', padding: '3px 10px', borderRadius: '20px', fontWeight: 500 }}>Bugün mevcut değil</span>
                                    ) : (
                                        <>
                                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#5F7154' }}>₺{item.basePrice.toFixed(2)}</span>
                                            <span style={{
                                                background: '#5F7154', color: '#fff',
                                                borderRadius: '20px', padding: '4px 14px',
                                                fontSize: '13px', fontWeight: 500,
                                            }}>+ Ekle</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Modifier Modal */}
            {selectedItem && (
                <ModifierModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}

            {/* Cart Drawer */}
            {cartOpen && (
                <CartDrawer onClose={() => setCartOpen(false)} />
            )}
        </div>
    )
}