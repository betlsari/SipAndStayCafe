import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { menuApi } from '../../api/menu.api'
import { useCartStore } from '../../store/cartStore'
import type { MenuCategoryDto, MenuItemDto } from '../../types/index'
import ModifierModal from '../../components/customer/ModifierModal'
import CartDrawer from '../../components/customer/CartDrawer'
import './Menu.css'

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F7]">
            <div className="text-6xl animate-bounce">☕</div>
            <p className="mt-4 font-black text-[#323232] tracking-tighter">MENÜ ÇİZİLİYOR...</p>
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFF5F7] p-6">
            <div className="doodle-card bg-rose-50 p-6 text-center">
                <p className="text-rose-700 font-bold">{error}</p>
            </div>
        </div>
    )

    const activeItems = categories.find(c => c.id === activeCategory)?.items ?? []
    const cartCount = getTotalCount()

    return (
        <div className="menu-doodle-container pb-32">

            {/* ── Header (Notebook Style) ── */}
            <div className="sticky top-0 z-30 p-4 bg-[#FFF5F7]/80 backdrop-blur-sm">
                <header className="notebook-header p-5 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-[#323232] leading-none rotate-[-1deg]">
                            SIP AND STAY
                        </h1>
                        {tableNumber > 0 && (
                            <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">
                                ★ Masa {tableNumber}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => setCartOpen(true)}
                        className="add-btn-sketch bg-[#FDA4AF] px-4 py-2 flex items-center gap-2 text-sm"
                    >
                        SEPET {cartCount > 0 && (
                            <span className="bg-white border-2 border-[#323232] px-2 rounded-full font-black text-xs">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </header>
            </div>

            {/* ── Category Tabs ── */}
            <div className="flex gap-3 overflow-x-auto px-5 py-2 no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`doodle-tab whitespace-nowrap px-6 py-2 font-black text-xs uppercase tracking-tight ${activeCategory === cat.id ? 'active' : ''
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* ── Items List ── */}
            <div className="px-5 mt-6 flex flex-col gap-5 max-w-2xl mx-auto">
                {activeItems.map((item) => (
                    <MenuItemCard
                        key={item.id}
                        item={item}
                        onClick={() => item.isAvailable && setSelectedItem(item)}
                    />
                ))}
            </div>

            {/* Modals */}
            {selectedItem && (
                <ModifierModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
            {cartOpen && (
                <CartDrawer onClose={() => setCartOpen(false)} />
            )}
        </div>
    )
}

function MenuItemCard({ item, onClick }: { item: MenuItemDto, onClick: () => void }) {
    const unavailable = !item.isAvailable

    return (
        <button
            onClick={onClick}
            disabled={unavailable}
            className={`doodle-card p-4 flex gap-4 text-left relative overflow-hidden ${unavailable ? 'opacity-60 grayscale cursor-not-allowed' : ''
                }`}
        >
            {/* Image Section */}
            <div className="relative flex-shrink-0">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-[#323232]"
                    />
                ) : (
                    <div className="w-24 h-24 bg-rose-50 rounded-2xl flex items-center justify-center text-4xl border-2 border-[#323232]">
                        🥣
                    </div>
                )}
                {unavailable && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                        <span className="bg-white border-2 border-[#323232] px-2 py-1 text-[10px] font-black rotate-[-12deg] shadow-sm">
                            TÜKENDİ
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                    <h3 className="text-lg font-black text-[#323232] leading-tight mb-1 uppercase">
                        {item.name}
                    </h3>
                    <p className="text-xs font-medium text-stone-500 line-clamp-2 italic">
                        {item.description}
                    </p>
                </div>

                <div className="flex justify-between items-end mt-3">
                    <span className="text-xl font-black text-rose-500 tracking-tighter">
                        ₺{item.basePrice.toFixed(2)}
                    </span>
                    {!unavailable && (
                        <span className="add-btn-sketch bg-[#A7F3D0] px-4 py-1.5 text-[11px] uppercase tracking-tighter">
                            + EKLE
                        </span>
                    )}
                </div>
            </div>
        </button>
    )
}