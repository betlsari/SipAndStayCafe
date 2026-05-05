import { useState } from 'react'
import { reportApi } from '../../api/report.api'
import type { DailySalesReportDto, WeeklySalesReportDto, TopSellingItemDto, HourlySalesDto } from '../../types/index'
import { toast } from 'sonner'

type ReportTab = 'daily' | 'weekly' | 'top' | 'peak'

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const today = () => new Date().toISOString().split('T')[0]
const weekAgo = () => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
}

// inputStyle sabitini değiştir
const inputCls = 'rp-input'



// StatCard bileşenini tamamen değiştir
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="rp-stat-card">
            <p className="rp-stat-label">{label}</p>
            <p className="rp-stat-value">{value}</p>
            {sub && <p className="rp-stat-sub">{sub}</p>}
        </div>
    )
}

// TopSellingTable bileşenini tamamen değiştir
function TopSellingTable({ items }: { items: TopSellingItemDto[] }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, i) => (
                <div key={item.menuItemId} className={`rp-top-row${i === 0 ? ' first' : ''}`}>
                    <span className="rp-top-rank">#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#323232', fontWeight: i === 0 ? 700 : 600 }}>
                        {item.productName}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>
                        {item.totalQuantitySold} adet
                    </span>
                    <span className="rp-top-revenue">{formatCurrency(item.totalRevenue)}</span>
                </div>
            ))}
        </div>
    )
}

// HourlyChart bileşenini tamamen değiştir
function HourlyChart({ hours }: { hours: HourlySalesDto[] }) {
    const maxRevenue = Math.max(...hours.map((h) => h.revenue), 1)
    const allHours = Array.from({ length: 24 }, (_, i) => {
        const found = hours.find((h) => h.hour === i)
        return found ?? { hour: i, orderCount: 0, revenue: 0 }
    })
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '90px', padding: '0 2px' }}>
                {allHours.map((h) => {
                    const pct = (h.revenue / maxRevenue) * 100
                    const hasData = h.revenue > 0
                    return (
                        <div
                            key={h.hour}
                            title={`${h.hour}:00 — ${formatCurrency(h.revenue)}`}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', cursor: 'default' }}
                        >
                            <div style={{
                                width: '100%',
                                borderRadius: '4px 4px 0 0',
                                border: hasData ? '2px solid #323232' : '1px solid #e0d8cc',
                                borderBottom: 'none',
                                background: hasData ? '#ffe66d' : '#f5f0e8',
                                height: `${Math.max(pct, hasData ? 8 : 3)}%`,
                                boxShadow: hasData ? '2px 0 0 #32323220' : 'none',
                                transition: 'height 0.3s',
                            }} />
                        </div>
                    )
                })}
            </div>
            <div style={{ borderTop: '2px solid #323232', marginTop: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                {[0, 6, 12, 18, 23].map(h => (
                    <span key={h} style={{ fontSize: '10px', color: '#888', fontWeight: 700, fontFamily: '"Comic Sans MS", cursive' }}>{h}:00</span>
                ))}
            </div>
        </div>
    )
}
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

    const peakHour = data?.hourlySales.length
        ? data.hourlySales.reduce((a, b) => a.revenue > b.revenue ? a : b).hour
        : null

    // DailyPanel return bloğunu tamamen değiştir
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                    type="date" value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                />
                <button onClick={fetch} disabled={loading} className={`rp-btn-primary${loading ? ' disabled' : ''}`}>
                    {loading ? 'Yükleniyor…' : '🔍 Getir'}
                </button>
                {data && (
                    <button onClick={handleDownload} disabled={downloading} className="rp-btn-secondary">
                        {downloading ? 'İndiriliyor…' : '⬇ PDF İndir'}
                    </button>
                )}
            </div>

            {data && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                        <StatCard label="Toplam Ciro" value={formatCurrency(data.totalRevenue)} />
                        <StatCard label="Toplam Sipariş" value={data.totalOrders} />
                        <StatCard label="En Yoğun Saat" value={peakHour !== null ? `${peakHour}:00` : '—'} />
                        <StatCard label="En Çok Satan" value={data.topSellingItems[0]?.productName ?? '—'} />
                    </div>
                    {data.topSellingItems.length > 0 && (
                        <div className="rp-section-card">
                            <p className="rp-section-title">🏆 En Çok Satan Ürünler</p>
                            <TopSellingTable items={data.topSellingItems} />
                        </div>
                    )}
                    {data.hourlySales.length > 0 && (
                        <div className="rp-section-card">
                            <p className="rp-section-title">📊 Saatlik Satış Dağılımı</p>
                            <HourlyChart hours={data.hourlySales} />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

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

    // WeeklyPanel return bloğunu tamamen değiştir
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="rp-date-label">Başlangıç</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="rp-date-label">Bitiş</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                </div>
                <button onClick={fetch} disabled={loading} className={`rp-btn-primary${loading ? ' disabled' : ''}`}>
                    {loading ? 'Yükleniyor…' : '🔍 Getir'}
                </button>
                {data && (
                    <button onClick={handleDownload} disabled={downloading} className="rp-btn-secondary">
                        {downloading ? 'İndiriliyor…' : '⬇ PDF İndir'}
                    </button>
                )}
            </div>

            {data && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                        <StatCard label="Toplam Ciro" value={formatCurrency(data.totalRevenue)} />
                        <StatCard label="Toplam Sipariş" value={data.totalOrders} />
                        <StatCard label="Günlük Ort." value={formatCurrency(data.totalRevenue / Math.max(data.dailySales.length, 1))} />
                    </div>
                    {data.dailySales.length > 0 && (
                        <div className="rp-section-card">
                            <p className="rp-section-title">📅 Günlük Özet</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {data.dailySales.map((d) => (
                                    <div key={d.date} className="rp-daily-row">
                                        <span style={{ fontSize: '13px', color: '#323232', fontWeight: 600 }}>
                                            {new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <span style={{ fontSize: '12px', color: '#888' }}>{d.orderCount} sipariş</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5F7154', minWidth: '80px', textAlign: 'right' }}>
                                                {formatCurrency(d.revenue)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.topSellingItems.length > 0 && (
                        <div className="rp-section-card">
                            <p className="rp-section-title">🏆 Haftanın En Çok Satanları</p>
                            <TopSellingTable items={data.topSellingItems} />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

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

    // TopSellingPanel return bloğunu tamamen değiştir
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="rp-date-label">Top</span>
                    <input
                        type="number" min={1} max={50} value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className={inputCls} style={{ width: '70px' }}
                    />
                </div>
                <button onClick={fetch} disabled={loading} className={`rp-btn-primary${loading ? ' disabled' : ''}`}>
                    {loading ? 'Yükleniyor…' : '🔍 Getir'}
                </button>
            </div>
            {data && (
                <div className="rp-section-card">
                    <TopSellingTable items={data} />
                </div>
            )}
        </div>
    )
}

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

    // PeakHoursPanel return bloğunu tamamen değiştir
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                <button onClick={fetch} disabled={loading} className={`rp-btn-primary${loading ? ' disabled' : ''}`}>
                    {loading ? 'Yükleniyor…' : '🔍 Getir'}
                </button>
            </div>
            {data && (
                <div className="rp-section-card">
                    <p className="rp-section-title">🕐 Saatlik Yoğunluk</p>
                    <HourlyChart hours={data} />
                </div>
            )}
        </div>
    )
}

const TABS: { id: ReportTab; label: string; emoji: string }[] = [
    { id: 'daily', label: 'Günlük', emoji: '📊' },
    { id: 'weekly', label: 'Haftalık', emoji: '📈' },
    { id: 'top', label: 'En Çok Satan', emoji: '🏆' },
    { id: 'peak', label: 'Yoğun Saatler', emoji: '🕐' },
]

export default function ReportPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('daily')

    // ReportPage return bloğunu tamamen değiştir
    return (
        <>
            <style>{`
                .rp-page {
                    padding: 32px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    max-width: 900px; min-height: 100vh;
                    background: #FFF5F7;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                }
                .rp-page-title {
                    font-size: 26px; font-weight: 900; color: #323232;
                    margin: 0 0 4px; transform: rotate(-1deg);
                    display: inline-block; text-transform: uppercase;
                }
                .rp-page-sub { font-size: 12px; color: #888; margin: 0; font-style: italic; }
                .rp-input {
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 9px 12px;
                    font-size: 13px; font-weight: 600;
                    color: #323232; background: #ffffff;
                    outline: none;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s; cursor: pointer;
                    box-sizing: border-box;
                }
                .rp-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    background: #fffdf5; transform: translate(-1px,-1px);
                }
                .rp-btn-primary {
                    padding: 9px 18px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffe66d;
                    font-size: 13px; font-weight: 900; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .rp-btn-primary:hover:not(.disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; background: #ffd700; }
                .rp-btn-primary.disabled { opacity: 0.6; cursor: not-allowed; }
                .rp-btn-secondary {
                    display: flex; align-items: center; gap: 6px;
                    padding: 9px 16px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffffff;
                    font-size: 13px; font-weight: 700; color: #5F7154;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .rp-btn-secondary:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; background: #f0fff4; }
                .rp-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
                .rp-tab {
                    display: flex; align-items: center; gap: 6px;
                    padding: 9px 16px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232;
                    font-size: 13px; font-weight: 700;
                    cursor: pointer; font-family: inherit;
                    transition: all 0.15s;
                    box-shadow: 3px 3px 0 #323232;
                }
                .rp-tab.active {
                    background: #ffe66d; color: #323232;
                    transform: translate(-1px,-1px);
                    box-shadow: 4px 4px 0 #323232;
                }
                .rp-tab:not(.active) {
                    background: #ffffff; color: #666;
                }
                .rp-tab:not(.active):hover { background: #fff9e6; transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; }
                .rp-stat-card {
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    padding: 14px 16px;
                    display: flex; flex-direction: column; gap: 4px;
                    box-shadow: 3px 3px 0 #323232;
                }
                .rp-stat-label { margin: 0; font-size: 11px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
                .rp-stat-value { margin: 0; font-size: 22px; font-weight: 900; color: #323232; letter-spacing: -0.02em; }
                .rp-stat-sub { margin: 0; font-size: 11px; color: #aaa; font-style: italic; }
                .rp-section-card {
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    padding: 18px;
                    box-shadow: 4px 4px 0 #323232;
                }
                .rp-section-title {
                    margin: 0 0 14px;
                    font-size: 12px; font-weight: 900; color: #323232;
                    text-transform: uppercase; letter-spacing: 0.08em;
                }
                .rp-top-row {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 12px;
                    background: #fffdf5;
                    border: 2px solid #32323220;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    transition: all 0.15s;
                }
                .rp-top-row:hover { border-color: #323232; box-shadow: 2px 2px 0 #323232; transform: translate(-1px,-1px); }
                .rp-top-row.first { background: #ffe66d; border-color: #323232; box-shadow: 3px 3px 0 #323232; }
                .rp-top-rank { font-size: 12px; font-weight: 900; color: #888; width: '22px'; text-align: center; }
                .rp-top-row.first .rp-top-rank { color: #323232; }
                .rp-top-revenue { font-size: 13px; font-weight: 700; color: #5F7154; flex-shrink: 0; min-width: 72px; text-align: right; }
                .rp-daily-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 2px dashed #32323220;
                }
                .rp-daily-row:last-child { border-bottom: none; }
                .rp-date-label { font-size: 12px; color: #888; font-weight: 700; white-space: nowrap; font-family: inherit; }
            `}</style>

            <div className="rp-page">
                <div style={{ marginBottom: '24px' }}>
                    <h1 className="rp-page-title">📈 Raporlar</h1>
                    <p className="rp-page-sub">Satış analizleri ve istatistikler</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    {TABS.map(({ id, label, emoji }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`rp-tab${activeTab === id ? ' active' : ''}`}
                        >
                            <span>{emoji}</span>
                            {label}
                        </button>
                    ))}
                </div>

                {activeTab === 'daily' && <DailyPanel />}
                {activeTab === 'weekly' && <WeeklyPanel />}
                {activeTab === 'top' && <TopSellingPanel />}
                {activeTab === 'peak' && <PeakHoursPanel />}
            </div>
        </>
    )
}