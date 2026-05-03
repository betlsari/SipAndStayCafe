import { useState, useEffect, useCallback } from 'react'
import { tableApi } from '../../api/table.api'
import type { TableDto } from '../../types/index'
import { Plus, Pencil, Trash2, X, Download } from 'lucide-react'
import { toast } from 'sonner'

const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #E0DDD6',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#2C3528',
    background: '#FDFCF9',
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
}

interface TableFormProps {
    initial?: TableDto | null
    onDone: () => void
    onClose: () => void
}

function TableForm({ initial, onDone, onClose }: TableFormProps) {
    const isEdit = !!initial
    const [tableNumber, setTableNumber] = useState(initial?.tableNumber ?? '')
    const [isActive, setIsActive] = useState(initial?.isActive ?? true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async () => {
        const num = Number(tableNumber)
        if (!num || num <= 0) { setError('Geçerli bir masa numarası girin.'); return }
        setSaving(true)
        setError(null)
        try {
            if (isEdit && initial) {
                await tableApi.update(initial.id, { tableNumber: num, isActive })
                toast.success('Masa güncellendi.')
            } else {
                await tableApi.create({ tableNumber: num })
                toast.success('Masa oluşturuldu.')
            }
            onDone()
        } catch {
            setError('Bu masa numarası zaten kullanılıyor olabilir.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,53,40,0.35)', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '400px', background: '#FDFCF9', borderRadius: '20px', border: '1px solid #E0DDD6', boxShadow: '0 8px 32px rgba(95,113,84,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #EDE9E0' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#2C3528', margin: 0 }}>{isEdit ? 'Masa Düzenle' : 'Yeni Masa Ekle'}</h2>
                    <button onClick={onClose} style={{ background: '#F0ECE4', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} color="#6A6560" />
                    </button>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#5F7154', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Masa Numarası</label>
                        <input
                            type="number"
                            min={1}
                            value={tableNumber}
                            onChange={e => setTableNumber(e.target.value)}
                            placeholder="Örn: 5"
                            style={inputStyle}
                            autoFocus
                            onFocus={e => (e.target.style.borderColor = '#82A76B')}
                            onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                        />
                    </div>
                    {isEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F7F5F0', border: '1px solid #E8E4DC', borderRadius: '10px', padding: '12px 14px' }}>
                            <span style={{ fontSize: '13px', color: '#4A4840' }}>Aktif</span>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', background: isActive ? '#5F7154' : '#D8D4CC', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
                            >
                                <span style={{ position: 'absolute', top: '3px', left: isActive ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                            </button>
                        </div>
                    )}
                    {error && <p style={{ fontSize: '13px', color: '#C06080', background: '#FAE8EE', padding: '10px 12px', borderRadius: '8px', margin: 0 }}>{error}</p>}
                </div>
                <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: '1px solid #E0DDD6', background: '#FFFFFF', fontSize: '13px', fontWeight: 500, color: '#6A6560', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}>İptal</button>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: 'none', background: saving ? '#8FAF80' : '#5F7154', fontSize: '13px', fontWeight: 500, color: '#FFFFFF', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, sans-serif', transition: 'background 0.15s' }}>
                        {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function TableCard({ table, onEdit, onDelete, onDownloadQr, downloading }: {
    table: TableDto
    onEdit: (t: TableDto) => void
    onDelete: (t: TableDto) => void
    onDownloadQr: (t: TableDto) => void
    downloading: boolean
}) {
    const [hovered, setHovered] = useState(false)
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E8E4DC',
                borderColor: hovered ? '#C8D5C0' : '#E8E4DC',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: hovered ? '0 4px 16px rgba(95,113,84,0.08)' : '0 1px 4px rgba(95,113,84,0.04)',
                opacity: table.isActive ? 1 : 0.65,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <span style={{ fontFamily: 'system-ui, monospace', fontSize: '30px', fontWeight: 700, color: '#2C3528', letterSpacing: '-0.02em', lineHeight: 1 }}>{table.tableNumber}</span>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: table.isActive ? '#82A76B' : '#9A8E80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: table.isActive ? '#82A76B' : '#C8C4BC', display: 'inline-block' }} />
                        {table.isActive ? 'Aktif' : 'Pasif'}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                    <button onClick={() => onEdit(table)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#F0F4EC', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Pencil size={13} color="#5F7154" />
                    </button>
                    <button onClick={() => onDelete(table)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#FAE8EE', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={13} color="#C06080" />
                    </button>
                </div>
            </div>

            <p style={{ fontSize: '10px', color: '#C0BBAE', fontFamily: 'monospace', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{table.qRCodeUrl}</p>

            <button
                onClick={() => onDownloadQr(table)}
                disabled={downloading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '9px',
                    borderRadius: '10px',
                    border: '1px solid #E0DDD6',
                    background: '#F7F5F0',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#5F7154',
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    fontFamily: 'system-ui, sans-serif',
                    opacity: downloading ? 0.6 : 1,
                    transition: 'background 0.15s',
                }}
                onMouseEnter={e => !downloading && (e.currentTarget.style.background = '#EDF2E8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F7F5F0')}
            >
                {downloading ? (
                    <span style={{ width: '12px', height: '12px', border: '2px solid #C8D5C0', borderTopColor: '#5F7154', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                ) : (
                    <Download size={12} color="#5F7154" />
                )}
                QR İndir
            </button>
        </div>
    )
}

export default function TableManagement() {
    const [tables, setTables] = useState<TableDto[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<TableDto | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<TableDto | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    const fetchTables = useCallback(async () => {
        try {
            const res = await tableApi.getAll()
            setTables(res.data.sort((a, b) => a.tableNumber - b.tableNumber))
        } catch {
            toast.error('Masalar yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const load = async () => { await fetchTables() }
        load()
    }, [fetchTables])

    const handleDownloadQr = async (table: TableDto) => {
        setDownloadingId(table.id)
        try {
            const res = await tableApi.getQrCode(table.id)
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `masa-${table.tableNumber}-qr.png`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            toast.error('QR kodu indirilemedi.')
        } finally {
            setDownloadingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await tableApi.delete(deleteTarget.id)
            toast.success('Masa silindi.')
            setDeleteTarget(null)
            fetchTables()
        } catch {
            toast.error('Silme işlemi başarısız.')
        } finally {
            setDeleting(false)
        }
    }

    const handleFormDone = () => {
        setShowForm(false)
        setEditTarget(null)
        fetchTables()
    }

    const active = tables.filter(t => t.isActive)
    const inactive = tables.filter(t => !t.isActive)

    return (
        <div style={{ padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '900px', background: '#F7F5F0', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2C3528', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Masa & QR Yönetimi</h1>
                    <p style={{ fontSize: '13px', color: '#9A8E80', margin: 0 }}>{active.length} aktif · {inactive.length} pasif masa</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setShowForm(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '12px', border: 'none', background: '#5F7154', color: '#FFFFFF', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'system-ui, sans-serif', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#4A5C40')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#5F7154')}
                >
                    <Plus size={14} />
                    Masa Ekle
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>☕</div>
                    <p style={{ color: '#9A8E80', fontSize: '13px' }}>Yükleniyor…</p>
                </div>
            ) : tables.length === 0 ? (
                <div style={{ padding: '60px 20px', border: '1.5px dashed #D8D4CC', borderRadius: '16px', textAlign: 'center', color: '#B0AB9E', fontSize: '14px', background: '#FDFCF9' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🪑</div>
                    Henüz masa eklenmemiş.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {active.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#9A8E80', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Aktif Masalar · {active.length}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                {active.map(table => (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        onEdit={t => { setEditTarget(t); setShowForm(true) }}
                                        onDelete={setDeleteTarget}
                                        onDownloadQr={handleDownloadQr}
                                        downloading={downloadingId === table.id}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    {inactive.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#9A8E80', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Pasif Masalar · {inactive.length}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                {inactive.map(table => (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        onEdit={t => { setEditTarget(t); setShowForm(true) }}
                                        onDelete={setDeleteTarget}
                                        onDownloadQr={handleDownloadQr}
                                        downloading={downloadingId === table.id}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {showForm && <TableForm initial={editTarget} onDone={handleFormDone} onClose={() => { setShowForm(false); setEditTarget(null) }} />}

            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,53,40,0.35)', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ width: '100%', maxWidth: '360px', background: '#FDFCF9', borderRadius: '20px', border: '1px solid #E0DDD6', padding: '28px 24px', textAlign: 'center' }}>
                        <div style={{ width: '52px', height: '52px', background: '#FAE8EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Trash2 size={22} color="#C06080" />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3528', margin: '0 0 8px' }}>Masa {deleteTarget.tableNumber}'i Sil?</h2>
                        <p style={{ fontSize: '13px', color: '#8A8478', margin: '0 0 22px', lineHeight: 1.5 }}>Bu masa ve bağlı tüm verileri kalıcı olarak silinecek.</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: '1px solid #E0DDD6', background: '#FFFFFF', fontSize: '13px', fontWeight: 500, color: '#6A6560', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}>Vazgeç</button>
                            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: 'none', background: deleting ? '#E8B0C0' : '#C06080', fontSize: '13px', fontWeight: 500, color: '#FFFFFF', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, sans-serif' }}>
                                {deleting ? 'Siliniyor…' : 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}