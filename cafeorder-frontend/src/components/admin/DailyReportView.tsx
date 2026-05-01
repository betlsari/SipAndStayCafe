import type { DailySalesReportDto } from '../../types/index'
import { TrendingUp, ShoppingBag } from 'lucide-react'

const fmt = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

export default function DailyReportView({ data }: { data: DailySalesReportDto }) {
    const maxRevenue = Math.max(...data.hourlySales.map((h) => h.revenue), 1)

    return (
        <div className="flex flex-col gap-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{fmt(data.totalRevenue)}</p>
                    <p className="text-xs text-zinc-500">Toplam Ciro</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center mb-1">
                        <ShoppingBag className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{data.totalOrders}</p>
                    <p className="text-xs text-zinc-500">Toplam Sipariþ</p>
                </div>
            </div>

            {/* Peak hours */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-zinc-300">Saatlik Yoðunluk</h3>
                {data.hourlySales.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4">Veri yok</p>
                ) : (
                    <div className="flex items-end gap-1 h-28">
                        {Array.from({ length: 24 }, (_, i) => {
                            const hour = data.hourlySales.find((h) => h.hour === i)
                            const height = hour ? Math.max((hour.revenue / maxRevenue) * 100, 4) : 0
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div
                                        className="w-full rounded-t-sm bg-violet-600/70 hover:bg-violet-500 transition-colors"
                                        style={{ height: `${height}%` }}
                                    />
                                    {hour && (
                                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                                            <div className="bg-zinc-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                                                {i}:00 · {fmt(hour.revenue)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
                <div className="flex justify-between text-xs text-zinc-600">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:00</span>
                </div>
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