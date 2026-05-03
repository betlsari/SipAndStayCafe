import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '../store/authStore'
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5291'

const buildConnection = (hubPath: string, anonymous = false) => {
    const builder = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}${hubPath}`, {
            accessTokenFactory: anonymous
                ? undefined
                : () => useAuthStore.getState().token ?? '',
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)

    return builder.build()
}

export const createOrderHubConnection = () => buildConnection('/hubs/orders', false)
export const createCashierHubConnection = () => buildConnection('/hubs/cashier', false)