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

const inputStyle: React.CSSProperties = {
    border: '1px solid #E0DDD6',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '13px',
    color: '#2C3528',
    background: '#FFFFFF',
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    transition: 'border-color 0.15s',
    cursor: 'pointer',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div style={{
            background: '#FFFFFF',
            border: '1px solid #E8E4DC',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9A8E80', fontWeight: 500 }}>{label}</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#2C3528', letterSpacing: '-0.01em' }}>{value}</p>
            {sub && <p style={{ margin: 0, fontSize: '11px', color: '#B0AB9E' }}>{sub}</p>}
        </div>
    )
}

function TopSellingTable({ items }: { items: TopSellingItemDto[] }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.map((item, i) => (
                <div key={item.menuItemId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: i === 0 ? '#EDF2E8' : '#FDFCF9',
                    border: '1px solid',
                    borderColor: i === 0 ? '#C8D5C0' : '#EDE9E0',
                    borderRadius: '10px',
                }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: i === 0 ? '#3D5C34' : '#B0AB9E',
                        width: '20px',
                        textAlign: 'center',
                    }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#2C3528', fontWeight: i === 0 ? 500 : 400 }}>
                        {item.productName}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8A8478', flexShrink: 0 }}>
                        {item.totalQuantitySold} adet
                    </span>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#5F7154',
                        flexShrink: 0,
                        minWidth: '70px',
                        textAlign: 'right',
                    }}>
                        {formatCurrency(item.totalRevenue)}
                    </span>
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
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                {allHours.map((h) => {
                    const pct = (h.revenue / maxRevenue) * 100
                    return (
                        <div
                            key={h.hour}
                            title={`${h.hour}:00 — ${formatCurrency(h.revenue)}`}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                height: '100%',
                                cursor: 'default',
                            }}
                        >
                            <div style={{
                                width: '100%',
                                borderRadius: '3px 3px 0 0',
                                background: h.revenue > 0 ? '#82A76B' : '#E8E4DC',
                                height: `${Math.max(pct, h.revenue > 0 ? 6 : 2)}%`,
                                transition: 'background 0.15s',
                            }} />
                        </div>
                    )
                })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                {[0, 6, 12, 18, 23].map(h => (
                    <span key={h} style={{ fontSize: '10px', color: '#B0AB9E' }}>{h}:00</span>
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#82A76B')}
                    onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                />
                <button
                    onClick={fetch}
                    disabled={loading}
                    style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        background: loading ? '#8FAF80' : '#5F7154',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >{loading ? 'Yükleniyor…' : 'Getir'}</button>
                {data && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 16px',
                            borderRadius: '10px',
                            border: '1px solid #E0DDD6',
                            background: '#FFFFFF',
                            color: '#5F7154',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    >
                        ⬇ {downloading ? 'İndiriliyor…' : 'PDF İndir'}
                    </button>
                )}
            </div>

            {data && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                        <StatCard label="Toplam Ciro" value={formatCurrency(data.totalRevenue)} />
                        <StatCard label="Toplam Sipariş" value={data.totalOrders} />
                        <StatCard label="En Yoğun Saat" value={peakHour !== null ? `${peakHour}:00` : '—'} />
                        <StatCard label="En Çok Satan" value={data.topSellingItems[0]?.productName ?? '—'} />
                    </div>

                    {data.topSellingItems.length > 0 && (
                        <div style={{
                            background: '#FFFFFF',
                            border: '1px solid #E8E4DC',
                            borderRadius: '14px',
                            padding: '18px',
                        }}>
                            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 500, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.06em' }}>En Çok Satan Ürünler</p>
                            <TopSellingTable items={data.topSellingItems} />
                        </div>
                    )}

                    {data.hourlySales.length > 0 && (
                        <div style={{
                            background: '#FFFFFF',
                            border: '1px solid #E8E4DC',
                            borderRadius: '14px',
                            padding: '18px',
                        }}>
                            <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 500, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saatlik Satış Dağılımı</p>
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#9A8E80' }}>Başlangıç</span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#82A76B')}
                        onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#9A8E80' }}>Bitiş</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#82A76B')}
                        onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                    />
                </div>
                <button
                    onClick={fetch}
                    disabled={loading}
                    style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        background: loading ? '#8FAF80' : '#5F7154',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >{loading ? 'Yükleniyor…' : 'Getir'}</button>
                {data && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 16px',
                            borderRadius: '10px',
                            border: '1px solid #E0DDD6',
                            background: '#FFFFFF',
                            color: '#5F7154',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    >⬇ {downloading ? 'İndiriliyor…' : 'PDF İndir'}</button>
                )}
            </div>

            {data && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                        <StatCard label="Toplam Ciro" value={formatCurrency(data.totalRevenue)} />
                        <StatCard label="Toplam Sipariş" value={data.totalOrders} />
                        <StatCard
                            label="Günlük Ortalama"
                            value={formatCurrency(data.totalRevenue / Math.max(data.dailySales.length, 1))}
                        />
                    </div>

                    {data.dailySales.length > 0 && (
                        <div style={{
                            background: '#FFFFFF',
                            border: '1px solid #E8E4DC',
                            borderRadius: '14px',
                            padding: '18px',
                        }}>
                            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 500, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Günlük Özet</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {data.dailySales.map((d) => (
                                    <div key={d.date} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 0',
                                        borderBottom: '1px solid #EDE9E0',
                                    }}>
                                        <span style={{ fontSize: '13px', color: '#4A4840' }}>
                                            {new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <span style={{ fontSize: '12px', color: '#9A8E80' }}>{d.orderCount} sipariş</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#5F7154', minWidth: '80px', textAlign: 'right' }}>
                                                {formatCurrency(d.revenue)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.topSellingItems.length > 0 && (
                        <div style={{
                            background: '#FFFFFF',
                            border: '1px solid #E8E4DC',
                            borderRadius: '14px',
                            padding: '18px',
                        }}>
                            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 500, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Haftanın En Çok Satanları</p>
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#82A76B')} onBlur={e => (e.target.style.borderColor = '#E0DDD6')} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#82A76B')} onBlur={e => (e.target.style.borderColor = '#E0DDD6')} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#9A8E80' }}>Top</span>
                    <input
                        type="number"
                        min={1}
                        max={50}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        style={{ ...inputStyle, width: '60px' }}
                        onFocus={e => (e.target.style.borderColor = '#82A76B')}
                        onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                    />
                </div>
                <button
                    onClick={fetch}
                    disabled={loading}
                    style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        background: loading ? '#8FAF80' : '#5F7154',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >{loading ? 'Yükleniyor…' : 'Getir'}</button>
            </div>
            {data && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '14px', padding: '18px' }}>
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#82A76B')} onBlur={e => (e.target.style.borderColor = '#E0DDD6')} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#82A76B')} onBlur={e => (e.target.style.borderColor = '#E0DDD6')} />
                <button
                    onClick={fetch}
                    disabled={loading}
                    style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        background: loading ? '#8FAF80' : '#5F7154',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >{loading ? 'Yükleniyor…' : 'Getir'}</button>
            </div>
            {data && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '14px', padding: '18px' }}>
                    <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 500, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saatlik Yoğunluk</p>
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

    return (
        <div style={{
            padding: '32px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            maxWidth: '900px',
            background: '#F7F5F0',
            minHeight: '100vh',
        }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2C3528', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                    Raporlar
                </h1>
                <p style={{ fontSize: '13px', color: '#9A8E80', margin: 0 }}>Satış analizleri ve istatistikler</p>
            </div>

            {/* Tab'lar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {TABS.map(({ id, label, emoji }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 16px',
                            borderRadius: '10px',
                            border: activeTab === id ? 'none' : '1px solid #E0DDD6',
                            background: activeTab === id ? '#5F7154' : '#FFFFFF',
                            color: activeTab === id ? '#FFFFFF' : '#6A6560',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'system-ui, sans-serif',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            if (activeTab !== id) (e.currentTarget as HTMLElement).style.borderColor = '#C8D5C0'
                        }}
                        onMouseLeave={e => {
                            if (activeTab !== id) (e.currentTarget as HTMLElement).style.borderColor = '#E0DDD6'
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>{emoji}</span>
                        {label}
                    </button>
                ))}
            </div>

            {/* Panel içeriği */}
            {activeTab === 'daily' && <DailyPanel />}
            {activeTab === 'weekly' && <WeeklyPanel />}
            {activeTab === 'top' && <TopSellingPanel />}
            {activeTab === 'peak' && <PeakHoursPanel />}
        </div>
    )
}