import axiosInstance from './axiosInstance'
import type { InitiatePaymentRequest } from '../types/index'

export const paymentApi = {
    initiateCashierPayment: (data: InitiatePaymentRequest) =>
        axiosInstance.post<{ message: string }>('/payment/initiate-cashier', data),

    initiateOnlinePayment: (data: InitiatePaymentRequest) =>
        axiosInstance.post<{ checkoutFormContent: string }>('/payment/initiate-online', data),
}