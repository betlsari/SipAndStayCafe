import { useState, useEffect, useCallback } from 'react'
import { tableApi } from '../../api/table.api'
import type { TableDto } from '../../types/index'
import TableFormModal from '../../components/admin/TableFormModal'
import { Plus, Pencil, Trash2, QrCode, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function TableManagement() {
    const [tables, setTables] = useState<TableDto[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<TableDto | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
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
        // Always use an async function inside useEffect, not directly in the effect body
        const fetch = async () => {
            await fetchAll()
        }
        fetch()
    }, [fetchAll])

    const handleDelete = async (id: string, tableNumber: number) => {
        if (!confirm(`Masa ${tableNumber}'i silmek istediðinize emin misiniz?`)) return
        setDeletingId(id)
        try {
            await tableApi.delete(id)
            toast.success(`Masa ${tableNumber} silindi.`)
            setTables((prev) => prev.filter((t) => t.id !== id))
        } catch {
            toast.error('Masa silinemedi.')
        } finally {
            setDeletingId(null)
        }
    }

    const handleDownloadQr = async (id: string, tableNumber: number) => {
        setDownloadingId(id)
        try {
            const res = await tableApi.getQrCode(id)
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `masa-${tableNumber}-qr.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch {
            toast.error('QR kodu indirilemedi.')
        } finally {
            setDownloadingId(null)
        }
    }

    const handleSave = async () => {
        setModalOpen(false)
        setEditing(null)
        await fetchAll()
    }

    const openCreate = () => { setEditing(null); setModalOpen(true) }
    const openEdit = (table: TableDto) => { setEditing(table); setModalOpen(true) }

    const active = tables.filter((t) => t.isActive)
    const inactive = tables.filter((t) => !t.isActive)

    return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Masalar</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {active.length} aktif · {inactive.length} pasif
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Masa
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
            ) : tables.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-600 text-sm">
                    Henüz masa yok. Yeni bir tane oluþturun.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tables.map((table) => (
                        <div
                            key={table.id}
                            className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col gap-3 ${table.isActive ? 'border-zinc-800' : 'border-zinc-800 opacity-60'
                                }`}
                        >
                            {/* Top row */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center">
                                        <QrCode className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white leading-none">
                                            Masa {table.tableNumber}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5">#{table.tableNumber}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${table.isActive
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-zinc-700 text-zinc-400'
                                    }`}>
                                    {table.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>

                            {/* QR URL preview */}
                            <p className="text-xs text-zinc-600 truncate font-mono bg-zinc-800/60 rounded-lg px-2 py-1.5">
                                {table.qRCodeUrl}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                                <button
                                    onClick={() => handleDownloadQr(table.id, table.tableNumber)}
                                    disabled={downloadingId === table.id}
                                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-sky-400 transition-colors disabled:opacity-40 px-2 py-1.5 rounded-lg hover:bg-zinc-800"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    {downloadingId === table.id ? 'Ýndiriliyor…' : 'QR Ýndir'}
                                </button>
                                <div className="flex items-center gap-1 ml-auto">
                                    <button
                                        onClick={() => openEdit(table)}
                                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(table.id, table.tableNumber)}
                                        disabled={deletingId === table.id}
                                        className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-40"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <TableFormModal
                    table={editing}
                    onSave={handleSave}
                    onClose={() => { setModalOpen(false); setEditing(null) }}
                />
            )}
        </div>
    )
}