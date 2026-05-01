import { useState } from 'react'
import { reportApi } from '../../api/report.api'
import type { DailySalesReportDto, WeeklySalesReportDto } from '../../types/index'
import DailyReportView from '../../components/admin/DailyReportView'
import WeeklyReportView from '../../components/admin/WeeklyReportView'
import { FileDown, Search } from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'daily' | 'weekly'

const today = () => new Date().toISOString().slice(0, 10)
const weekAgo = () => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
}

const inputCls = 'bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500'

export default function ReportPage() {
    const [tab, setTab] = useState<Tab>('daily')

    const [dailyDate, setDailyDate] = useState(today())
    const [dailyData, setDailyData] = useState<DailySalesReportDto | null>(null)
    const [dailyLoading, setDailyLoading] = useState(false)

    const [startDate, setStartDate] = useState(weekAgo())
    const [endDate, setEndDate] = useState(today())
    const [weeklyData, setWeeklyData] = useState<WeeklySalesReportDto | null>(null)
    const [weeklyLoading, setWeeklyLoading] = useState(false)

    const [pdfLoading, setPdfLoading] = useState(false)

    const fetchDaily = async () => {
        setDailyLoading(true)
        try {
            const res = await reportApi.getDaily(dailyDate)
            setDailyData(res.data)
        } catch {
            toast.error('Günlük rapor yüklenemedi.')
        } finally {
            setDailyLoading(false)
        }
    }

    const fetchWeekly = async () => {
        if (startDate > endDate) { toast.error('Baþlangýç tarihi bitiþ tarihinden büyük olamaz.'); return }
        setWeeklyLoading(true)
        try {
            const res = await reportApi.getWeekly(startDate, endDate)
            setWeeklyData(res.data)
        } catch {
            toast.error('Haftalýk rapor yüklenemedi.')
        } finally {
            setWeeklyLoading(false)
        }
    }

    const downloadPdf = async () => {
        setPdfLoading(true)
        try {
            const res = tab === 'daily'
                ? await reportApi.getDailyPdf(dailyDate)
                : await reportApi.getWeeklyPdf(startDate, endDate)

            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = tab === 'daily'
                ? `gunluk-rapor-${dailyDate}.pdf`
                : `haftalik-rapor-${startDate}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch {
            toast.error('PDF indirilemedi.')
        } finally {
            setPdfLoading(false)
        }
    }

    const canDownloadPdf = tab === 'daily' ? !!dailyData : !!weeklyData

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Raporlar</h1>
                    <p className="text-sm text-zinc-500 mt-1">Satýþ ve performans analizi</p>
                </div>
                {canDownloadPdf && (
                    <button
                        onClick={downloadPdf}
                        disabled={pdfLoading}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-zinc-700"
                    >
                        <FileDown className="w-4 h-4" />
                        {pdfLoading ? 'Ýndiriliyor…' : 'PDF Ýndir'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
                {(['daily', 'weekly'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t
                                ? 'bg-violet-600 text-white'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        {t === 'daily' ? 'Günlük' : 'Haftalýk'}
                    </button>
                ))}
            </div>

            {/* Controls */}
            {tab === 'daily' ? (
                <div className="flex items-end gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tarih</label>
                        <input
                            type="date"
                            value={dailyDate}
                            max={today()}
                            onChange={(e) => setDailyDate(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <button
                        onClick={fetchDaily}
                        disabled={dailyLoading}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        {dailyLoading ? 'Yükleniyor…' : 'Getir'}
                    </button>
                </div>
            ) : (
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Baþlangýç</label>
                        <input
                            type="date"
                            value={startDate}
                            max={endDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Bitiþ</label>
                        <input
                            type="date"
                            value={endDate}
                            max={today()}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <button
                        onClick={fetchWeekly}
                        disabled={weeklyLoading}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        {weeklyLoading ? 'Yükleniyor…' : 'Getir'}
                    </button>
                </div>
            )}

            {/* Content */}
            {tab === 'daily' && (
                dailyLoading ? (
                    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
                ) : dailyData ? (
                    <DailyReportView data={dailyData} />
                ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-600 text-sm">
                        Tarih seçip "Getir" butonuna basýn.
                    </div>
                )
            )}

            {tab === 'weekly' && (
                weeklyLoading ? (
                    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
                ) : weeklyData ? (
                    <WeeklyReportView data={weeklyData} />
                ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-600 text-sm">
                        Tarih aralýðý seçip "Getir" butonuna basýn.
                    </div>
                )
            )}
        </div>
    )
}