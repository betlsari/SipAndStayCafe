import { create } from 'zustand'
import type { MenuItemDto } from '../types/index'

export interface CartItem {
    menuItem: MenuItemDto
    quantity: number
    selectedModifierIds: string[]
    selectedModifierNames: string[]
    itemTotal: number
}

interface CartState {
    items: CartItem[]
    tableNumber: number | null

    setTable: (tableNumber: number) => void
    addItem: (item: CartItem) => void
    removeItem: (index: number) => void
    clearCart: () => void
    getTotalPrice: () => number
    getTotalCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    tableNumber: null,

    setTable: (tableNumber) => set({ tableNumber }),

    addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),

    removeItem: (index) =>
        set((state) => ({
            items: state.items.filter((_, i) => i !== index),
        })),

    clearCart: () => set({ items: [] }),

    getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.itemTotal, 0),

    getTotalCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
}))