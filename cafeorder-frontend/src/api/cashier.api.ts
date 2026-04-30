import axiosInstance from './axiosInstance'
import type {
    CashierSessionDto,
    CashierSessionDetailDto,
} from '../types/index'

export const cashierApi = {
    getActiveSessions: () =>
        axiosInstance.get<CashierSessionDto[]>('/cashier/sessions'),

    getPendingPayments: () =>
        axiosInstance.get<CashierSessionDto[]>('/cashier/sessions/pending-payment'),

    getSessionDetail: (id: string) =>
        axiosInstance.get<CashierSessionDetailDto>(`/cashier/sessions/${id}`),

    confirmPayment: (id: string) =>
        axiosInstance.post<void>(`/cashier/sessions/${id}/confirm-payment`),
}