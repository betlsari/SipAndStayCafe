// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'Owner' | 'Cashier' | 'KitchenStaff'

export interface AuthUser {
    userId: string
    displayName: string
    roles: UserRole[]
    refreshToken: string
    accessTokenExpiry: string
}

export interface AuthResponse {
    accessToken: string
    refreshToken: string
    accessTokenExpiry: string
    userId: string
    displayName: string
    roles: UserRole[]
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export type ModifierSelectionType = 'Single' | 'Multi'

export interface ModifierDto {
    id: string
    name: string
    additionalPrice: number
    displayOrder: number
    isActive: boolean
}

export interface ModifierGroupDto {
    id: string
    name: string
    selectionType: ModifierSelectionType
    isRequired: boolean
    displayOrder: number
    modifiers: ModifierDto[]
}

export interface MenuItemDto {
    id: string
    name: string
    description: string | null
    basePrice: number
    categoryId: string
    categoryName: string
    isAvailable: boolean
    imageUrl: string | null
    displayOrder: number
    modifierGroups: ModifierGroupDto[]
}

export interface MenuItemSummaryDto {
    id: string
    name: string
    basePrice: number
    categoryId: string
    isAvailable: boolean
    imageUrl: string | null
    displayOrder: number
}

export interface MenuCategoryDto {
    id: string
    name: string
    displayOrder: number
    items: MenuItemDto[]
}

export interface CategoryDto {
    id: string
    name: string
    displayOrder: number
    isActive: boolean
}

// ─── Menu Requests ────────────────────────────────────────────────────────────

export interface CreateCategoryRequest {
    name: string
    displayOrder: number
}

export interface UpdateCategoryRequest {
    name: string
    displayOrder: number
    isActive: boolean
}

export interface CreateMenuItemRequest {
    name: string
    description?: string
    basePrice: number
    categoryId: string
    imageUrl?: string
    displayOrder: number
}

export interface UpdateMenuItemRequest {
    name: string
    description?: string
    basePrice: number
    categoryId: string
    isAvailable: boolean
    imageUrl?: string
    displayOrder: number
}

export interface UpdateStockRequest {
    isAvailable: boolean
    note?: string
}

export interface CreateModifierGroupRequest {
    menuItemId: string
    name: string
    selectionType: ModifierSelectionType
    isRequired: boolean
    displayOrder: number
}

export interface UpdateModifierGroupRequest {
    name: string
    selectionType: ModifierSelectionType
    isRequired: boolean
    displayOrder: number
}

export interface CreateModifierRequest {
    modifierGroupId: string
    name: string
    additionalPrice: number
    displayOrder: number
}

export interface UpdateModifierRequest {
    name: string
    additionalPrice: number
    displayOrder: number
    isActive: boolean
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'Received' | 'BeingPrepared' | 'Ready'

export interface OrderItemRequest {
    menuItemId: string
    quantity: number
    selectedModifierIds: string[]
}

export interface PlaceOrderRequest {
    tableNumber: number
    items: OrderItemRequest[]
    note?: string
}

export interface WaiterCallRequest {
    tableNumber: number
    note?: string
}

export interface OrderItemDto {
    id: string
    productName: string
    quantity: number
    modifierSnapshots: string[]
    itemTotal: number
}

export interface OrderDto {
    id: string
    status: OrderStatus
    items: OrderItemDto[]
    total: number
    createdAt: string
    note?: string
}

export interface TableOrderHistoryDto {
    tableNumber: number
    orders: OrderDto[]
    grandTotal: number
}

// ─── Table / Session ──────────────────────────────────────────────────────────

export interface TableDto {
    id: string
    tableNumber: number
    qRCodeUrl: string
    isActive: boolean
}

export type PaymentMethod = 'None' | 'Cashier' | 'Online'
export type PaymentStatus = 'None' | 'Pending' | 'Completed' | 'Failed'

export interface TableSessionDto {
    id: string
    tableId: string
    tableNumber: number
    openedAt: string
    closedAt: string | null
    isPaid: boolean
    totalAmount: number
    paymentMethod: PaymentMethod
    paymentStatus: PaymentStatus
}

export interface CreateTableRequest {
    tableNumber: number
}

export interface UpdateTableRequest {
    tableNumber: number
    isActive: boolean
}

export interface CloseSessionRequest {
    sessionId: string
}

// ─── Cashier ─────────────────────────────────────────────────────────────────

export interface CashierSessionDto {
    tableNumber: number
    sessionId: string
    openedAt: string
    totalAmount: number
    paymentMethod: PaymentMethod | null
    paymentStatus: PaymentStatus
    orderCount: number
}

export interface CashierOrderItemDto {
    productName: string
    quantity: number
    modifierSnapshots: string[]
    itemTotal: number
}

export interface CashierOrderRoundDto {
    orderId: string
    status: string
    createdAt: string
    items: CashierOrderItemDto[]
    roundTotal: number
}

export interface CashierSessionDetailDto {
    tableNumber: number
    sessionId: string
    openedAt: string
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod | null
    grandTotal: number
    orderRounds: CashierOrderRoundDto[]
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface InitiatePaymentRequest {
    sessionId: string
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface TopSellingItemDto {
    menuItemId: string
    productName: string
    totalQuantitySold: number
    totalRevenue: number
}

export interface HourlySalesDto {
    hour: number
    orderCount: number
    revenue: number
}

export interface DailySalesSummaryDto {
    date: string
    orderCount: number
    revenue: number
}

export interface DailySalesReportDto {
    date: string
    totalRevenue: number
    totalOrders: number
    hourlySales: HourlySalesDto[]
    topSellingItems: TopSellingItemDto[]
}

export interface WeeklySalesReportDto {
    startDate: string
    endDate: string
    totalRevenue: number
    totalOrders: number
    dailySales: DailySalesSummaryDto[]
    topSellingItems: TopSellingItemDto[]
}