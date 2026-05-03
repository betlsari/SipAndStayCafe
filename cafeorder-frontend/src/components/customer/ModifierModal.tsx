import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import type { MenuItemDto, ModifierDto } from '../../types/index'

interface Props {
    item: MenuItemDto
    onClose: () => void
}

export default function ModifierModal({ item, onClose }: Props) {
    const { addItem } = useCartStore()
    const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
    const [quantity, setQuantity] = useState(1)
    const [error, setError] = useState<string | null>(null)

    const toggleModifier = (groupId: string, modifierId: string, isSingle: boolean) => {
        setSelectedModifiers((prev) => {
            if (isSingle) return { ...prev, [groupId]: [modifierId] }
            const current = prev[groupId] ?? []
            const exists = current.includes(modifierId)
            return { ...prev, [groupId]: exists ? current.filter(id => id !== modifierId) : [...current, modifierId] }
        })
    }

    const getSelectedModifierDetails = (): { ids: string[]; names: string[] } => {
        const ids: string[] = []
        const names: string[] = []
        item.modifierGroups.forEach((group) => {
            const selected = selectedModifiers[group.id] ?? []
            selected.forEach((modId) => {
                const mod = group.modifiers.find((m) => m.id === modId)
                if (mod) { ids.push(mod.id); names.push(mod.name) }
            })
        })
        return { ids, names }
    }

    const calculateTotal = (): number => {
        let total = item.basePrice
        item.modifierGroups.forEach((group) => {
            const selected = selectedModifiers[group.id] ?? []
            selected.forEach((modId) => {
                const mod = group.modifiers.find((m: ModifierDto) => m.id === modId)
                if (mod) total += mod.additionalPrice
            })
        })
        return total * quantity
    }

    const handleAdd = () => {
        for (const group of item.modifierGroups) {
            if (group.isRequired) {
                const selected = selectedModifiers[group.id] ?? []
                if (selected.length === 0) {
                    setError(`"${group.name}" seçimi zorunludur.`)
                    return
                }
            }
        }
        const { ids, names } = getSelectedModifierDetails()
        addItem({ menuItem: item, quantity, selectedModifierIds: ids, selectedModifierNames: names, itemTotal: calculateTotal() })
        onClose()
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
                maxHeight: '88vh', overflowY: 'auto',
            }}>
                {/* Header */}
                <div style={{
                    position: 'sticky', top: 0,
                    background: '#FDFCF9',
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid #EDE9E0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#2C3528', margin: 0 }}>{item.name}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F0ECE4', border: 'none', borderRadius: '50%',
                            width: '32px', height: '32px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#6A6560', fontSize: '18px', lineHeight: 1,
                        }}
                    >×</button>
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Image & Description */}
                    {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '14px' }} />
                    )}
                    {item.description && (
                        <p style={{ fontSize: '13px', color: '#8A8478', lineHeight: 1.5, margin: 0 }}>{item.description}</p>
                    )}

                    {/* Modifier Groups */}
                    {item.modifierGroups.map((group) => (
                        <div key={group.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#2C3528', margin: 0 }}>{group.name}</h3>
                                {group.isRequired && (
                                    <span style={{ fontSize: '11px', background: '#FAE8EE', color: '#A0536A', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>Zorunlu</span>
                                )}
                                <span style={{ fontSize: '11px', background: '#EDF0E8', color: '#5F7154', padding: '2px 8px', borderRadius: '20px' }}>
                                    {group.selectionType === 'Single' ? 'Tek seçim' : 'Çoklu seçim'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {group.modifiers.filter(m => m.isActive).map((mod) => {
                                    const isSelected = (selectedModifiers[group.id] ?? []).includes(mod.id)
                                    return (
                                        <button
                                            key={mod.id}
                                            onClick={() => toggleModifier(group.id, mod.id, group.selectionType === 'Single')}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '11px 14px',
                                                borderRadius: '12px',
                                                border: isSelected ? '1.5px solid #82A76B' : '1px solid #E0DDD6',
                                                background: isSelected ? '#F2F7EE' : '#fff',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: group.selectionType === 'Single' ? '50%' : '5px',
                                                    border: isSelected ? '2px solid #5F7154' : '1.5px solid #C0BBAE',
                                                    background: isSelected ? '#5F7154' : '#fff',
                                                    flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                                                </div>
                                                <span style={{ fontSize: '14px', color: '#2C3528' }}>{mod.name}</span>
                                            </div>
                                            {mod.additionalPrice > 0 && (
                                                <span style={{ fontSize: '13px', color: '#5F7154', fontWeight: 500 }}>+₺{mod.additionalPrice.toFixed(2)}</span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Error */}
                    {error && (
                        <p style={{ fontSize: '13px', color: '#C0392B', textAlign: 'center', background: '#FDF0EE', padding: '10px', borderRadius: '10px' }}>{error}</p>
                    )}

                    {/* Quantity */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                border: '1.5px solid #C8D5C0', background: '#fff',
                                fontSize: '20px', color: '#5F7154', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500,
                            }}
                        >−</button>
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#2C3528', minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
                        <button
                            onClick={() => setQuantity(q => q + 1)}
                            style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                border: 'none', background: '#5F7154',
                                fontSize: '20px', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500,
                            }}
                        >+</button>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    position: 'sticky', bottom: 0,
                    background: '#FDFCF9',
                    borderTop: '1px solid #EDE9E0',
                    padding: '14px 20px',
                }}>
                    <button
                        onClick={handleAdd}
                        style={{
                            width: '100%', background: '#5F7154', color: '#fff',
                            border: 'none', borderRadius: '14px',
                            padding: '14px 20px',
                            fontSize: '15px', fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                    >
                        <span>Sepete Ekle</span>
                        <span>₺{calculateTotal().toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}