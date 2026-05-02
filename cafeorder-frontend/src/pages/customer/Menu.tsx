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
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Menü yükleniyor...</p>
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-red-500">{error}</p>
        </div>
    )

    const activeItems = categories.find(c => c.id === activeCategory)?.items ?? []

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Menü</h1>
                {tableNumber > 0 && (
                    <span className="text-sm text-gray-500">Masa {tableNumber}</span>
                )}
                <button
                    onClick={() => setCartOpen(true)}
                    className="relative bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full"
                >
                    Sepet
                    {getTotalCount() > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {getTotalCount()}
                        </span>
                    )}
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b scrollbar-hide">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Items */}
            <div className="px-4 py-4 flex flex-col gap-3">
// Menu.tsx — items map bloğunu bununla değiştir
                {activeItems.map((item) => {
                    const unavailable = !item.isAvailable
                    return (
                        <button
                            key={item.id}
                            onClick={() => !unavailable && setSelectedItem(item)}
                            disabled={unavailable}
                            className={`w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 text-left transition-opacity ${unavailable ? 'opacity-60 cursor-not-allowed' : ''
                                }`}
                        >
                            <div className="relative shrink-0">
                                {item.imageUrl && (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className={`w-16 h-16 rounded-lg object-cover ${unavailable ? 'grayscale' : ''}`}
                                    />
                                )}
                                {unavailable && (
                                    <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white uppercase tracking-wider leading-tight text-center px-1">
                                            Tükendi
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold truncate ${unavailable ? 'text-gray-400' : 'text-gray-800'}`}>
                                    {item.name}
                                </p>
                                {item.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                                )}
                                {unavailable ? (
                                    <p className="text-xs text-red-400 font-medium mt-1">Bugün mevcut değil</p>
                                ) : (
                                    <p className="text-purple-600 font-bold mt-1">₺{item.basePrice.toFixed(2)}</p>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Modifier Modal */}
            {selectedItem && (
                <ModifierModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {/* Cart Drawer */}
            {cartOpen && (
                <CartDrawer onClose={() => setCartOpen(false)} />
            )}
        </div>
    )
}