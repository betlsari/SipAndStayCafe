import type { WeeklySalesReportDto } from '../../types/index'

interface Props {
    data: WeeklySalesReportDto
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })

export default function WeeklyReportView({ data }: Props) {
    const maxRevenue = Math.max(...data.dailySales.map((d) => d.revenue), 1)

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Haftalýk Ciro</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.totalRevenue)}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Toplam Sipariþ</p>
                    <p className="text-2xl font-bold text-white">{data.totalOrders}</p>
                </div>
                {data.totalOrders > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 col-span-2">
                        <p className="text-xs text-zinc-500 mb-1">Sipariþ Baþý Ortalama</p>
                        <p className="text-2xl font-bold text-violet-400">
                            {formatCurrency(data.totalRevenue / data.totalOrders)}
                        </p>
                    </div>
                )}
            </div>

            {/* Daily Bar Chart */}
            {data.dailySales.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                        Günlük Kýrýlým
                    </h2>
                    <div className="flex flex-col gap-2">
                        {data.dailySales.map((day) => {
                            const pct = (day.revenue / maxRevenue) * 100
                            return (
                                <div key={day.date} className="flex items-center gap-3">
                                    <span className="text-xs text-zinc-500 w-24 shrink-0">{formatDate(day.date)}</span>
                                    <div className="flex-1 h-6 bg-zinc-800 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full bg-violet-500/70 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                                            style={{ width: `${Math.max(pct, 2)}%` }}
                                        >
                                            {pct > 20 && (
                                                <span className="text-[10px] font-bold text-white/80">
                                                    {formatCurrency(day.revenue)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-zinc-400 w-20 text-right shrink-0">
                                        {formatCurrency(day.revenue)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Top Selling */}
            {data.topSellingItems.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                        Haftanýn En Çok Satanlarý
                    </h2>
                    <div className="flex flex-col gap-2">
                        {data.topSellingItems.map((item, i) => (
                            <div
                                key={item.menuItemId}
                                className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0"
                            >
                                <span
                                    className={`text-xs font-black w-5 shrink-0 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-700' : 'text-zinc-600'
                                        }`}
                                >
                                    #{i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-200 truncate">{item.productName}</p>
                                    <p className="text-xs text-zinc-500">{item.totalQuantitySold} adet</p>
                                </div>
                                <p className="text-sm font-bold text-emerald-400 shrink-0">
                                    {formatCurrency(item.totalRevenue)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.topSellingItems.length === 0 && data.dailySales.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-zinc-600 text-sm">
                    Bu tarih aralýðý için satýþ verisi bulunamadý.
                </div>
            )}
        </div>
    )
}