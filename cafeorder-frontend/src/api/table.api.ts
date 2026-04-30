import axiosInstance from './axiosInstance'
import type {
    TableDto,
    TableSessionDto,
    CreateTableRequest,
    UpdateTableRequest,
} from '../types/index'

export const tableApi = {
    getAll: () =>
        axiosInstance.get<TableDto[]>('/tables'),

    getById: (id: string) =>
        axiosInstance.get<TableDto>(`/tables/${id}`),

    create: (data: CreateTableRequest) =>
        axiosInstance.post<TableDto>('/tables', data),

    update: (id: string, data: UpdateTableRequest) =>
        axiosInstance.put<TableDto>(`/tables/${id}`, data),

    delete: (id: string) =>
        axiosInstance.delete<void>(`/tables/${id}`),

    getQrCode: (id: string) =>
        axiosInstance.get<Blob>(`/tables/${id}/qr`, { responseType: 'blob' }),

    getActiveSession: (id: string) =>
        axiosInstance.get<TableSessionDto | null>(`/tables/${id}/session`),

    openSession: (id: string) =>
        axiosInstance.post<TableSessionDto>(`/tables/${id}/session/open`),

    closeSession: (tableId: string, sessionId: string) =>
        axiosInstance.post<void>(`/tables/${tableId}/session/close`, { sessionId }),
}