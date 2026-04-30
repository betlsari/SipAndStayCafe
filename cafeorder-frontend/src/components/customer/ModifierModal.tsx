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
            if (isSingle) {
                return { ...prev, [groupId]: [modifierId] }
            }
            const current = prev[groupId] ?? []
            const exists = current.includes(modifierId)
            return {
                ...prev,
                [groupId]: exists
                    ? current.filter((id) => id !== modifierId)
                    : [...current, modifierId],
            }
        })
    }

    const getSelectedModifierDetails = (): { ids: string[]; names: string[] } => {
        const ids: string[] = []
        const names: string[] = []
        item.modifierGroups.forEach((group) => {
            const selected = selectedModifiers[group.id] ?? []
            selected.forEach((modId) => {
                const mod = group.modifiers.find((m) => m.id === modId)
                if (mod) {
                    ids.push(mod.id)
                    names.push(mod.name)
                }
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
        addItem({
            menuItem: item,
            quantity,
            selectedModifierIds: ids,
            selectedModifierNames: names,
            itemTotal: calculateTotal(),
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
            <div className="w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-4 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">{item.name}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="px-4 py-4 flex flex-col gap-6">
                    {/* Image & Description */}
                    {item.imageUrl && (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-48 object-cover rounded-xl"
                        />
                    )}
                    {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                    )}

                    {/* Modifier Groups */}
                    {item.modifierGroups.map((group) => (
                        <div key={group.id}>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-700">{group.name}</h3>
                                {group.isRequired && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                        Zorunlu
                                    </span>
                                )}
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                    {group.selectionType === 'Single' ? 'Tek seçim' : 'Çoklu seçim'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {group.modifiers
                                    .filter((m) => m.isActive)
                                    .map((mod) => {
                                        const isSelected = (selectedModifiers[group.id] ?? []).includes(mod.id)
                                        return (
                                            <button
                                                key={mod.id}
                                                onClick={() => toggleModifier(group.id, mod.id, group.selectionType === 'Single')}
                                                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                                                    isSelected
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 bg-white'
                                                }`}
                                            >
                                                <span className="text-sm text-gray-700">{mod.name}</span>
                                                {mod.additionalPrice > 0 && (
                                                    <span className="text-sm text-purple-600 font-medium">
                                                        +?{mod.additionalPrice.toFixed(2)}
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    {/* Quantity */}
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600 flex items-center justify-center"
                        >
                            ?
                        </button>
                        <span className="text-lg font-semibold text-gray-800">{quantity}</span>
                        <button
                            onClick={() => setQuantity((q) => q + 1)}
                            className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600 flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t px-4 py-4">
                    <button
                        onClick={handleAdd}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-between px-6"
                    >
                        <span>Sepete Ekle</span>
                        <span>?{calculateTotal().toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}