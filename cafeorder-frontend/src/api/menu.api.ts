import axiosInstance from './axiosInstance'
import type {
    MenuCategoryDto,
    MenuItemDto,
    MenuItemSummaryDto,
    CategoryDto,
    ModifierGroupDto,
    ModifierDto,
    CreateMenuItemRequest,
    UpdateMenuItemRequest,
    UpdateStockRequest,
    CreateModifierGroupRequest,
    UpdateModifierGroupRequest,
    CreateModifierRequest,
    UpdateModifierRequest,
} from '../types/index'

export const menuApi = {
    // Public
    getPublicMenu: () =>
        axiosInstance.get<MenuCategoryDto[]>('/menu'),

    // MenuItem
    getAllItems: () =>
        axiosInstance.get<MenuItemSummaryDto[]>('/menu/items'),

    getItemById: (id: string) =>
        axiosInstance.get<MenuItemDto>(`/menu/items/${id}`),

    createItem: (data: CreateMenuItemRequest) =>
        axiosInstance.post<MenuItemDto>('/menu/items', data),

    updateItem: (id: string, data: UpdateMenuItemRequest) =>
        axiosInstance.put<MenuItemSummaryDto>(`/menu/items/${id}`, data),

    deleteItem: (id: string) =>
        axiosInstance.delete<void>(`/menu/items/${id}`),

    updateStock: (id: string, data: UpdateStockRequest) =>
        axiosInstance.patch<void>(`/menu/items/${id}/stock`, data),

    // ModifierGroup
    createModifierGroup: (data: CreateModifierGroupRequest) =>
        axiosInstance.post<ModifierGroupDto>('/menu/modifier-groups', data),

    updateModifierGroup: (id: string, data: UpdateModifierGroupRequest) =>
        axiosInstance.put<ModifierGroupDto>(`/menu/modifier-groups/${id}`, data),

    deleteModifierGroup: (id: string) =>
        axiosInstance.delete<void>(`/menu/modifier-groups/${id}`),

    // Modifier
    createModifier: (data: CreateModifierRequest) =>
        axiosInstance.post<ModifierDto>('/menu/modifiers', data),

    updateModifier: (id: string, data: UpdateModifierRequest) =>
        axiosInstance.put<ModifierDto>(`/menu/modifiers/${id}`, data),

    deleteModifier: (id: string) =>
        axiosInstance.delete<void>(`/menu/modifiers/${id}`),
}