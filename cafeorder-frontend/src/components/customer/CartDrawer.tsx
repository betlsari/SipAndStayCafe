import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { orderApi } from '../../api/order.api'
import { useState } from 'react'

interface Props {
    onClose: () => void
}

export default function CartDrawer({ onClose }: Props) {
    const navigate = useNavigate()
    const { items, tableNumber, removeItem, clearCart, getTotalPrice } = useCartStore()
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOrder = async () => {
        if (!tableNumber) {
            setError('Masa numarasi bulunamadi.')
            return
        }
        if (items.length === 0) {
            setError('Sepetiniz bos.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await orderApi.placeOrder({
                tableNumber,
                items: items.map((i) => ({
                    menuItemId: i.menuItem.id,
                    quantity: i.quantity,
                    selectedModifierIds: i.selectedModifierIds,
                })),
                note: note || undefined,
            })
            clearCart()
            onClose()
            navigate(`/order-status?table=${tableNumber}`)
        } catch {
            setError('Siparis gonderilemedi. Tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
            <div className="w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="px-4 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Sepetim</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                    {items.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">Sepetiniz bos.</p>
                    ) : (
                        items.map((item, index) => (
                            <div key={index} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">
                                        {item.quantity}x {item.menuItem.name}
                                    </p>
                                    {item.selectedModifierNames.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.selectedModifierNames.join(', ')}
                                        </p>
                                    )}
                                    <p className="text-purple-600 font-bold text-sm mt-1">
                                        ₺{item.itemTotal.toFixed(2)}                                    </p>
                                </div>
                                <button
                                    onClick={() => removeItem(index)}
                                    className="text-red-400 hover:text-red-600 text-lg ml-2"
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    )}

                    {/* Note */}
                    {items.length > 0 && (
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Siparis notu (opsiyonel)..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    )}

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t px-4 py-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-medium">Toplam</span>
                            <span className="text-purple-600 font-bold text-lg">
                                ₺{getTotalPrice().toFixed(2)}
                            </span>
                        </div>
                        <button
                            onClick={handleOrder}
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                            {loading ? 'Gonderiliyor...' : 'Siparisi Gonder'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}