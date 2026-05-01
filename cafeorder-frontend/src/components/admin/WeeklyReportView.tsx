import type { WeeklySalesReportDto } from '../../types/index'
import { TrendingUp, ShoppingBag, Calendar } from 'lucide-react'

const fmt = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })

export default function WeeklyReportView({ data }: { data: WeeklySalesReportDto }) {
    const maxRevenue = Math.max(...data.dailySales.map((d) => d.revenue), 1)

    return (
        <div className="flex flex-col gap-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{fmt(data.totalRevenue)}</p>
                    <p className="text-xs text-zinc-500">Haftalýk Ciro</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center mb-1">
                        <ShoppingBag className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{data.totalOrders}</p>
                    <p className="text-xs text-zinc-500">Toplam Sipariþ</p>
                </div>
            </div>

            {/* Daily breakdown bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-zinc-300">Günlük Ciro</h3>
                {data.dailySales.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4">Veri yok</p>
                ) : (
                    <div className="flex items-end gap-2 h-32">
                        {data.dailySales.map((day) => {
                            const height = Math.max((day.revenue / maxRevenue) * 100, 4)
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div
                                        className="w-full rounded-t-sm bg-violet-600/70 hover:bg-violet-500 transition-colors"
                                        style={{ height: `${height}%` }}
                                    />
                                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                                        <div className="bg-zinc-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                                            {fmtDate(day.date)} · {fmt(day.revenue)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 truncate w-full text-center">
                                        {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Daily table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    Gün Gün Özet
                </h3>
                {data.dailySales.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4">Veri yok</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-3 text-xs text-zinc-500 font-medium px-2">
                            <span>Tarih</span>
                            <span className="text-center">Sipariþ</span>
                            <span className="text-right">Ciro</span>
                        </div>
                        {data.dailySales.map((day) => (
                            <div key={day.date} className="grid grid-cols-3 items-center bg-zinc-800/60 rounded-xl px-3 py-2.5">
                                <span className="text-sm text-zinc-200">{fmtDate(day.date)}</span>
                                <span className="text-sm text-zinc-300 text-center font-semibold">{day.orderCount}</span>
                                <span className="text-sm text-emerald-400 text-right font-semibold">{fmt(day.revenue)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top selling */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-zinc-300">En Çok Satanlar</h3>
                {data.topSellingItems.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4">Veri yok</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-3 text-xs text-zinc-500 font-medium px-2">
                            <span>Ürün</span>
                            <span className="text-center">Adet</span>
                            <span className="text-right">Ciro</span>
                        </div>
                        {data.topSellingItems.map((item, i) => (
                            <div key={item.menuItemId} className="grid grid-cols-3 items-center bg-zinc-800/60 rounded-xl px-3 py-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-mono text-zinc-500 w-4">{i + 1}</span>
                                    <span className="text-sm text-zinc-200 truncate">{item.productName}</span>
                                </div>
                                <span className="text-sm text-zinc-300 text-center font-semibold">{item.totalQuantitySold}</span>
                                <span className="text-sm text-emerald-400 text-right font-semibold">{fmt(item.totalRevenue)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}