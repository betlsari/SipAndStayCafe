import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5291'

const buildConnection = (hubPath: string, anonymous = false) => {
    return new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}${hubPath}`, {
            accessTokenFactory: anonymous
                ? undefined
                : () => useAuthStore.getState().token ?? '',
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build()
}

// Müþteri sayfalarý: anonymous (token yok)
export const createOrderHubConnection = () => buildConnection('/hubs/orders', true)

// Mutfak ekraný: KitchenStaff token ile
export const createKitchenHubConnection = () => buildConnection('/hubs/orders', false)

// Kasiyer paneli: Cashier/Owner token ile
export const createCashierHubConnection = () => buildConnection('/hubs/cashier', false)