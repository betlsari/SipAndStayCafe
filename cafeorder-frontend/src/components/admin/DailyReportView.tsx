import type { DailySalesReportDto } from '../../types/index'

interface Props {
    data: DailySalesReportDto
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

export default function DailyReportView({ data }: Props) {
    const maxRevenue = Math.max(...data.hourlySales.map((h) => h.revenue), 1)

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Toplam Ciro</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.totalRevenue)}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500 mb-1">Toplam Sipariþ</p>
                    <p className="text-2xl font-bold text-white">{data.totalOrders}</p>
                </div>
            </div>

            {/* Hourly Chart */}
            {data.hourlySales.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                        Saatlik Yoðunluk
                    </h2>
                    <div className="flex items-end gap-1 h-28">
                        {data.hourlySales.map((h) => {
                            const pct = (h.revenue / maxRevenue) * 100
                            return (
                                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="relative w-full flex justify-center">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                            <div className="bg-zinc-700 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                                                {formatCurrency(h.revenue)}
                                                <br />
                                                <span className="text-zinc-400">{h.orderCount} sipariþ</span>
                                            </div>
                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-700" />
                                        </div>
                                        <div
                                            className="w-full rounded-t-md bg-violet-500/70 hover:bg-violet-400 transition-colors min-h-[4px]"
                                            style={{ height: `${Math.max(pct, 4)}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-zinc-600 tabular-nums">{h.hour}</span>
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
                        En Çok Satanlar
                    </h2>
                    <div className="flex flex-col gap-2">
                        {data.topSellingItems.map((item, i) => (
                            <div
                                key={item.menuItemId}
                                className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0"
                            >
                                <span className="text-xs font-black text-zinc-600 w-5 shrink-0">#{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-200 truncate">{item.productName}</p>
                                    <p className="text-xs text-zinc-500">{item.totalQuantitySold} adet satýldý</p>
                                </div>
                                <p className="text-sm font-bold text-emerald-400 shrink-0">
                                    {formatCurrency(item.totalRevenue)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.topSellingItems.length === 0 && data.hourlySales.length === 0 && (
                <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-zinc-600 text-sm">
                    Bu tarih için satýþ verisi bulunamadý.
                </div>
            )}
        </div>
    )
}