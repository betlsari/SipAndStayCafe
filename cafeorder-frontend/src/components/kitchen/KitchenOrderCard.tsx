import { useState } from 'react'
import { orderApi } from '../../api/order.api'
import type { OrderDto, OrderStatus } from '../../types/index'

interface Props {
    order: OrderDto
    tableNumber: number
    onStatusUpdated: (orderId: string, newStatus: OrderStatus) => void
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; dot: string }> = {
    Received: { label: 'Alındı', bg: '#ffe66d', dot: '#323232' },
    BeingPrepared: { label: 'Hazırlanıyor', bg: '#d4edff', dot: '#323232' },
    Ready: { label: 'Hazır', bg: '#d4edda', dot: '#323232' },
}

export default function KitchenOrderCard({ order, tableNumber, onStatusUpdated }: Props) {
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (newStatus: OrderStatus) => {
        setLoading(true)
        try {
            await orderApi.updateOrderStatus(order.id, newStatus)
            onStatusUpdated(order.id, newStatus)
        } catch (err) {
            console.error('Durum güncellenemedi:', err)
        } finally {
            setLoading(false)
        }
    }

    const config = statusConfig[order.status] ?? statusConfig.Received

    const time = new Date(order.createdAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <>
            <style>{`
                .koc-card {
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    padding: 14px;
                    display: flex; flex-direction: column; gap: 12px;
                    box-shadow: 4px 4px 0 #323232;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                    transition: all 0.15s;
                }
                .koc-card:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0 #323232;
                }
                .koc-header {
                    display: flex; align-items: center; justify-content: space-between;
                }
                .koc-table {
                    font-size: 16px; font-weight: 900; color: #323232;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .koc-status-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    border: 2px solid #323232; display: inline-block;
                }
                .koc-status-label {
                    font-size: 10px; font-weight: 700; color: #323232;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    padding: 2px 8px; border-radius: 20px;
                    border: 2px solid #323232;
                    box-shadow: 1px 1px 0 #323232;
                }
                .koc-time {
                    font-size: 11px; color: #888; font-style: italic;
                }
                .koc-items {
                    display: flex; flex-direction: column; gap: 8px;
                }
                .koc-item-row {
                    display: flex; align-items: flex-start; gap: 8px;
                }
                .koc-item-qty {
                    font-size: 13px; font-weight: 900; color: #5F7154;
                    width: 26px; flex-shrink: 0;
                }
                .koc-item-name {
                    font-size: 13px; font-weight: 700; color: #323232; margin: 0;
                }
                .koc-item-mods {
                    font-size: 11px; color: #888; margin: 2px 0 0; font-style: italic;
                }
                .koc-note {
                    background: #fffdf5;
                    border: 2px dashed #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 8px 12px;
                    font-size: 12px; color: #666; font-style: italic;
                    display: flex; align-items: flex-start; gap: 6px;
                }
                .koc-actions {
                    display: flex; gap: 8px; padding-top: 4px;
                    border-top: 2px dashed #32323230;
                }
                .koc-btn {
                    flex: 1; padding: 10px;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    border: 2px solid #323232;
                    font-size: 12px; font-weight: 900; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .koc-btn:hover:not(:disabled) {
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0 #323232;
                }
                .koc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .koc-btn-prepare { background: #d4edff; }
                .koc-btn-ready { background: #d4edda; }
                .koc-delivered {
                    flex: 1; padding: 10px;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    border: 2px solid #323232;
                    background: #d4edda;
                    font-size: 12px; font-weight: 900; color: #323232;
                    text-align: center; font-family: inherit;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    box-shadow: 3px 3px 0 #323232;
                }
            `}</style>

            <div className="koc-card" style={{ background: config.bg }}>
                <div className="koc-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="koc-table">Masa {tableNumber}</span>
                        <span className="koc-status-dot" style={{ background: config.dot }} />
                        <span className="koc-status-label">{config.label}</span>
                    </div>
                    <span className="koc-time">{time}</span>
                </div>

                <div className="koc-items">
                    {order.items.map((item) => (
                        <div key={item.id} className="koc-item-row">
                            <span className="koc-item-qty">{item.quantity}x</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="koc-item-name">{item.productName}</p>
                                {item.modifierSnapshots.length > 0 && (
                                    <p className="koc-item-mods">
                                        {item.modifierSnapshots.join(' · ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {order.note && (
                    <div className="koc-note">
                        <span style={{ flexShrink: 0 }}>📝</span>
                        <span>{order.note}</span>
                    </div>
                )}

                <div className="koc-actions">
                    {order.status === 'Received' && (
                        <button
                            onClick={() => handleStatusChange('BeingPrepared')}
                            disabled={loading}
                            className="koc-btn koc-btn-prepare"
                        >
                            {loading ? '...' : '▶ Hazırlanıyor'}
                        </button>
                    )}
                    {order.status === 'BeingPrepared' && (
                        <button
                            onClick={() => handleStatusChange('Ready')}
                            disabled={loading}
                            className="koc-btn koc-btn-ready"
                        >
                            {loading ? '...' : '✓ Hazır'}
                        </button>
                    )}
                    {order.status === 'Ready' && (
                        <div className="koc-delivered">✓ Teslim Edildi</div>
                    )}
                </div>
            </div>
        </>
    )
}