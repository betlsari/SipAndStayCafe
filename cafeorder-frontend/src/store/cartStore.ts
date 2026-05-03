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
    sessionId: string | null

    setTable: (tableNumber: number) => void
    setSessionId: (id: string) => void
    addItem: (item: CartItem) => void
    removeItem: (index: number) => void
    clearCart: () => void
    getTotalPrice: () => number
    getTotalCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    tableNumber: null,
    sessionId: null,

    setTable: (tableNumber) => set({ tableNumber }),

    setSessionId: (id) => set({ sessionId: id }),

    addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),

    removeItem: (index) =>
        set((state) => ({
            items: state.items.filter((_, i) => i !== index),
        })),

    // sessionId kasýtlý korunuyor — ödeme sayfasýna geçiþte hâlâ gerekli
    clearCart: () => set({ items: [], sessionId: null }),

    getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.itemTotal, 0),

    getTotalCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
}))