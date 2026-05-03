import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { orderApi } from '../../api/order.api'
import { useState } from 'react'

interface Props {
    onClose: () => void
}

export default function CartDrawer({ onClose }: Props) {
    const navigate = useNavigate()
    const { items, tableNumber, removeItem, clearCart, getTotalPrice, setSessionId } = useCartStore()
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOrder = async () => {
        if (!tableNumber) { setError('Masa numarası bulunamadı.'); return }
        if (items.length === 0) { setError('Sepetiniz boş.'); return }
        setLoading(true)
        setError(null)
        try {
            const res = await orderApi.placeOrder({
                tableNumber,
                items: items.map(i => ({
                    menuItemId: i.menuItem.id,
                    quantity: i.quantity,
                    selectedModifierIds: i.selectedModifierIds,
                })),
                note: note || undefined,
            })
            if (res.data.sessionId) setSessionId(res.data.sessionId)
            clearCart()
            onClose()
            navigate(`/order-status?table=${tableNumber}`)
        } catch {
            setError('Sipariş gönderilemedi. Tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(44,53,40,0.45)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                width: '100%', maxWidth: '520px',
                background: '#FDFCF9',
                borderRadius: '24px 24px 0 0',
                maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #EDE9E0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#2C3528', margin: 0 }}>Sepetim</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F0ECE4', border: 'none', borderRadius: '50%',
                            width: '32px', height: '32px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#6A6560', fontSize: '18px',
                        }}
                    >×</button>
                </div>

                {/* Items */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#A09890' }}>
                            <p style={{ fontSize: '28px', margin: '0 0 8px' }}>🛒</p>
                            <p style={{ fontSize: '14px', margin: 0 }}>Sepetiniz boş</p>
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div key={index} style={{
                                background: '#F7F5F0',
                                borderRadius: '12px',
                                border: '1px solid #E8E4DC',
                                padding: '12px 14px',
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#2C3528', margin: '0 0 3px' }}>
                                        {item.quantity}× {item.menuItem.name}
                                    </p>
                                    {item.selectedModifierNames.length > 0 && (
                                        <p style={{ fontSize: '12px', color: '#8A8478', margin: '0 0 6px' }}>{item.selectedModifierNames.join(', ')}</p>
                                    )}
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#5F7154', margin: 0 }}>₺{item.itemTotal.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => removeItem(index)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#C0A090', fontSize: '18px', padding: '0 0 0 10px', lineHeight: 1,
                                    }}
                                >×</button>
                            </div>
                        ))
                    )}

                    {items.length > 0 && (
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Sipariş notu (opsiyonel)..."
                            style={{
                                width: '100%', border: '1px solid #E0DDD6',
                                borderRadius: '12px', padding: '10px 14px',
                                fontSize: '13px', color: '#2C3528', background: '#fff',
                                resize: 'none', height: '72px',
                                outline: 'none', boxSizing: 'border-box',
                                fontFamily: 'inherit',
                            }}
                        />
                    )}

                    {error && (
                        <p style={{ fontSize: '13px', color: '#C0392B', textAlign: 'center', background: '#FDF0EE', padding: '10px', borderRadius: '10px' }}>{error}</p>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div style={{
                        borderTop: '1px solid #EDE9E0',
                        padding: '14px 20px',
                        flexShrink: 0, background: '#FDFCF9',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                            <span style={{ fontSize: '14px', color: '#6A6560', fontWeight: 500 }}>Toplam</span>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#5F7154' }}>₺{getTotalPrice().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleOrder}
                            disabled={loading}
                            style={{
                                background: loading ? '#8FAF80' : '#5F7154',
                                color: '#fff', border: 'none',
                                borderRadius: '14px', padding: '14px',
                                fontSize: '15px', fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                width: '100%',
                                transition: 'background 0.2s',
                            }}
                        >
                            {loading ? 'Gönderiliyor…' : 'Siparişi Gönder'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}