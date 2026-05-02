import { useState } from 'react'
import { reportApi } from '../../api/report.api'
import type { DailySalesReportDto, WeeklySalesReportDto, TopSellingItemDto, HourlySalesDto } from '../../types/index'
import { toast } from 'sonner'
import { BarChart2, Download, TrendingUp, ShoppingBag, Clock } from 'lucide-react'

type ReportTab = 'daily' | 'weekly' | 'top' | 'peak'

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const today = () => new Date().toISOString().split('T')[0]
const weekAgo = () => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
}

const inputCls =
    'bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500'

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
        </div>
    )
}

// ── Daily Panel ───────────────────────────────────────────────────────────────
function DailyPanel() {
    const [date, setDate] = useState(today())
    const [data, setData] = useState<DailySalesReportDto | null>(null)
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const fetch = async () => {
        setLoading(true)
        try {
            const res = await reportApi.getDaily(date)
            setData(res.data)
        } catch {
            toast.error('Rapor yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const res = await reportApi.getDailyPdf(date)
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `gunluk-rapor-${date}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            toast.error('PDF indirilemedi.')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                <button
                    onClick={fetch}
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                    {loading ? 'Yükleniyor…' : 'Raporu Getir'}
                </button>
                {data && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'İndiriliyor…' : 'PDF İndir'}
                    </button>
                )}
            </div>

            {data && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard label="Toplam Ciro" value={formatCurrency(data.totalRevenue)} />
                        <StatCard label="Toplam Sipariş" value={data.totalOrders} />
                        <StatCard label="En Yoğun Saat" value={`${peakHour(data.hourlySales)}:00`} />
                        <StatCard label="En Çok Satan" value={data.topSellingItems[0]?.productName ?? '—'} />
                    </div>

                    {data.topSellingItems.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                            <h3 className="text-sm font-semibold text-zinc-400 mb-3">En Çok Satan Ürünler</h3>
                            <TopSellingTable items={data.topSellingItems} />
                        </div>
                    )}

                    {data.hourlySales.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Saatlik Satış</h3>
                            <HourlyChart hours={data.hourlySales} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Weekly Panel ──────────────────────────────────────────────────────────────
function WeeklyPanel() {
    const [startDate, setStartDate] = useState(weekAgo())
    const [endDate, setEndDate] = useState(today())
    const [data, setData] = useState<WeeklySalesReportDto | null>(null)
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const fetch = async () => {
        setLoading(true)
        try {
            const res = await reportApi.getWeekly(startDate, endDate)
            setData(res.data)
        } catch {
            toast.error('Rapor yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const res = await reportApi.getWeeklyPdf(startDate, endDate)
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `haftalik-rapor-${startDate}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            toast.error('PDF indirilemedi.')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Başlangıç</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Bitiş</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                </div>
                <button
                    onClick={fetch}
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                    {loading ? 'Yükleniyor…' : 'Raporu Getir'}
                </button>
                {data && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'İndiriliyor…' : 'PDF İndir'}
                    </button>
                )}
            </div>

            {data && (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <StatCard label="Toplam Ciro" value={formatCurrency(data.totalRevenue)} />
                        <StatCard label="Toplam Sipariş" value={data.totalOrders} />
                        <StatCard label="Günlük Ort. Ciro" value={formatCurrency(data.totalRevenue / Math.max(data.dailySales.length, 1))} />
                    </div>

                    {data.dailySales.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Günlük Özet</h3>
                            <div className="flex flex-col gap-2">
                                {data.dailySales.map((d) => (
                                    <div key={d.date} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                                        <span className="text-sm text-zinc-300">
                                            {new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        <div className="flex items-center gap-4 text-right">
                                            <span className="text-xs text-zinc-500">{d.orderCount} sipariş</span>
                                            <span className="text-sm font-semibold text-white">{formatCurrency(d.revenue)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.topSellingItems.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Haftanın En Çok Satanları</h3>
                            <TopSellingTable items={data.topSellingItems} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Top Selling Panel ─────────────────────────────────────────────────────────
function TopSellingPanel() {
    const [startDate, setStartDate] = useState(weekAgo())
    const [endDate, setEndDate] = useState(today())
    const [count, setCount] = useState(10)
    const [data, setData] = useState<TopSellingItemDto[] | null>(null)
    const [loading, setLoading] = useState(false)

    const fetch = async () => {
        setLoading(true)
        try {
            const res = await reportApi.getTopSelling(startDate, endDate, count)
            setData(res.data)
        } catch {
            toast.error('Rapor yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Top</span>
                    <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className={`${inputCls} w-20`} />
                </div>
                <button
                    onClick={fetch}
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                    {loading ? 'Yükleniyor…' : 'Getir'}
                </button>
            </div>

            {data && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <TopSellingTable items={data} />
                </div>
            )}
        </div>
    )
}

// ── Peak Hours Panel ──────────────────────────────────────────────────────────
function PeakHoursPanel() {
    const [startDate, setStartDate] = useState(weekAgo())
    const [endDate, setEndDate] = useState(today())
    const [data, setData] = useState<HourlySalesDto[] | null>(null)
    const [loading, setLoading] = useState(false)

    const fetch = async () => {
        setLoading(true)
        try {
            const res = await reportApi.getPeakHours(startDate, endDate)
            setData(res.data)
        } catch {
            toast.error('Rapor yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                <button
                    onClick={fetch}
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                    {loading ? 'Yükleniyor…' : 'Getir'}
                </button>
            </div>

            {data && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-zinc-400 mb-3">Saatlik Yoğunluk</h3>
                    <HourlyChart hours={data} />
                </div>
            )}
        </div>
    )
}

// ── Shared Sub-components ─────────────────────────────────────────────────────
function TopSellingTable({ items }: { items: TopSellingItemDto[] }) {
    return (
        <div className="flex flex-col gap-2">
            {items.map((item, i) => (
                <div key={item.menuItemId} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-xs font-mono text-zinc-600 w-5 shrink-0">#{i + 1}</span>
                    <span className="flex-1 text-sm text-zinc-200 truncate">{item.productName}</span>
                    <span className="text-xs text-zinc-500 shrink-0">{item.totalQuantitySold} adet</span>
                    <span className="text-sm font-semibold text-white shrink-0">{formatCurrency(item.totalRevenue)}</span>
                </div>
            ))}
        </div>
    )
}

function HourlyChart({ hours }: { hours: HourlySalesDto[] }) {
    const maxRevenue = Math.max(...hours.map((h) => h.revenue), 1)
    const allHours = Array.from({ length: 24 }, (_, i) => {
        const found = hours.find((h) => h.hour === i)
        return found ?? { hour: i, orderCount: 0, revenue: 0 }
    })

    return (
        <div className="flex items-end gap-1 h-24">
            {allHours.map((h) => {
                const pct = (h.revenue / maxRevenue) * 100
                return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${h.hour}:00 — ${formatCurrency(h.revenue)}`}>
                        <div
                            className="w-full rounded-sm bg-violet-600/60 group-hover:bg-violet-500 transition-colors"
                            style={{ height: `${Math.max(pct, h.revenue > 0 ? 4 : 0)}%` }}
                        />
                        {h.hour % 4 === 0 && (
                            <span className="text-[9px] text-zinc-600">{h.hour}</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function peakHour(hours: HourlySalesDto[]) {
    if (!hours.length) return '—'
    return hours.reduce((a, b) => (a.revenue > b.revenue ? a : b)).hour
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'daily', label: 'Günlük', icon: BarChart2 },
    { id: 'weekly', label: 'Haftalık', icon: TrendingUp },
    { id: 'top', label: 'En Çok Satan', icon: ShoppingBag },
    { id: 'peak', label: 'Yoğun Saatler', icon: Clock },
]

export default function ReportPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('daily')

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Raporlar</h1>
                <p className="text-sm text-zinc-500 mt-1">Satış analizleri ve istatistikler</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === id
                                ? 'bg-violet-600 text-white'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Panel */}
            <div>
                {activeTab === 'daily' && <DailyPanel />}
                {activeTab === 'weekly' && <WeeklyPanel />}
                {activeTab === 'top' && <TopSellingPanel />}
                {activeTab === 'peak' && <PeakHoursPanel />}
            </div>
        </div>
    )
}