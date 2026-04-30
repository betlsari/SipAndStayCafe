import axiosInstance from './axiosInstance'
import type {
    DailySalesReportDto,
    WeeklySalesReportDto,
    TopSellingItemDto,
    HourlySalesDto,
} from '../types/index'

export const reportApi = {
    getDaily: (date: string) =>
        axiosInstance.get<DailySalesReportDto>('/reports/daily', { params: { date } }),

    getWeekly: (startDate: string, endDate: string) =>
        axiosInstance.get<WeeklySalesReportDto>('/reports/weekly', { params: { startDate, endDate } }),

    getTopSelling: (startDate: string, endDate: string, count = 5) =>
        axiosInstance.get<TopSellingItemDto[]>('/reports/top-selling', { params: { startDate, endDate, count } }),

    getPeakHours: (startDate: string, endDate: string) =>
        axiosInstance.get<HourlySalesDto[]>('/reports/peak-hours', { params: { startDate, endDate } }),

    getDailyPdf: (date: string) =>
        axiosInstance.get<Blob>('/reports/daily/pdf', { params: { date }, responseType: 'blob' }),

    getWeeklyPdf: (startDate: string, endDate: string) =>
        axiosInstance.get<Blob>('/reports/weekly/pdf', { params: { startDate, endDate }, responseType: 'blob' }),
}