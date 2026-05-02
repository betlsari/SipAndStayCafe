import { useState, useEffect, useCallback } from 'react'
import { tableApi } from '../../api/table.api'
import type { TableDto } from '../../types/index'
import { Plus, Pencil, Trash2, X, Download } from 'lucide-react'
import { toast } from 'sonner'

const inputCls =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-base font-bold text-white">{isEdit ? 'Masa Düzenle' : 'Yeni Masa Ekle'}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-5 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Masa Numarası</label>
                        <input
                            type="number"
                            min={1}
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="Örn: 5"
                            className={inputCls}
                            autoFocus
                        />
                    </div>
                    {isEdit && (
                        <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                            <span className="text-sm text-zinc-300">Aktif</span>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-violet-600' : 'bg-zinc-600'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>
                <div className="px-5 py-4 border-t border-zinc-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
                    </button>
                </div>
            </div>
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

    // ✅ ESLint fix: async wrapper inside useEffect
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

    const active = tables.filter((t) => t.isActive)
    const inactive = tables.filter((t) => !t.isActive)

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Masa & QR Yönetimi</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {active.length} aktif · {inactive.length} pasif masa
                    </p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setShowForm(true) }}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Masa Ekle
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
            ) : tables.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center text-zinc-600 text-sm">
                    Henüz masa eklenmemiş.
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {active.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">
                                Aktif Masalar · {active.length}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {active.map((table) => (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        onEdit={(t) => { setEditTarget(t); setShowForm(true) }}
                                        onDelete={setDeleteTarget}
                                        onDownloadQr={handleDownloadQr}
                                        downloading={downloadingId === table.id}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    {inactive.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">
                                Pasif Masalar · {inactive.length}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {inactive.map((table) => (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        onEdit={(t) => { setEditTarget(t); setShowForm(true) }}
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

            {showForm && (
                <TableForm
                    initial={editTarget}
                    onDone={handleFormDone}
                    onClose={() => { setShowForm(false); setEditTarget(null) }}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Masa {deleteTarget.tableNumber}'i Sil?</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            Bu masa ve bağlı tüm verileri kalıcı olarak silinecek.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 bg-zinc-800 text-white py-2.5 rounded-xl text-sm font-semibold"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                            >
                                {deleting ? 'Siliniyor…' : 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function TableCard({
    table,
    onEdit,
    onDelete,
    onDownloadQr,
    downloading,
}: {
    table: TableDto
    onEdit: (t: TableDto) => void
    onDelete: (t: TableDto) => void
    onDownloadQr: (t: TableDto) => void
    downloading: boolean
}) {
    return (
        <div className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col gap-3 group ${table.isActive ? 'border-zinc-800' : 'border-zinc-800 opacity-60'}`}>
            <div className="flex items-start justify-between">
                <div>
                    <span className="font-mono text-3xl font-bold text-white">{table.tableNumber}</span>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {table.isActive ? (
                            <span className="text-emerald-400">● Aktif</span>
                        ) : (
                            <span className="text-zinc-500">● Pasif</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(table)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(table)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-zinc-600 font-mono truncate">{table.qRCodeUrl}</p>

            <button
                onClick={() => onDownloadQr(table)}
                disabled={downloading}
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-semibold py-2 rounded-xl transition-colors"
            >
                {downloading ? (
                    <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-violet-400 rounded-full animate-spin" />
                ) : (
                    <Download className="w-3.5 h-3.5" />
                )}
                QR İndir
            </button>
        </div>
    )
}