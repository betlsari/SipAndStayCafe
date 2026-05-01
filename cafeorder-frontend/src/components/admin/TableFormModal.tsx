import { useState } from 'react'
import { tableApi } from '../../api/table.api'
import type { TableDto } from '../../types/index'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    table: TableDto | null
    onSave: () => void
    onClose: () => void
}

export default function TableFormModal({ table, onSave, onClose }: Props) {
    const isEdit = table !== null

    const [tableNumber, setTableNumber] = useState(() => table?.tableNumber ?? 1)
    const [isActive, setIsActive] = useState(() => table?.isActive ?? true)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

   
    const handleSubmit = async () => {
        if (!tableNumber || tableNumber < 1) {
            setError('Geçerli bir masa numarasý girin.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            if (isEdit) {
                await tableApi.update(table.id, { tableNumber, isActive })
                toast.success(`Masa ${tableNumber} güncellendi.`)
            } else {
                await tableApi.create({ tableNumber })
                toast.success(`Masa ${tableNumber} oluþturuldu.`)
            }
            onSave()
        } catch {
            setError('Ýþlem baþarýsýz. Masa numarasý zaten kullanýmda olabilir.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-base font-bold text-white">
                        {isEdit ? `Masa ${table.tableNumber} Düzenle` : 'Yeni Masa'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Masa Numarasý
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={tableNumber}
                            onChange={(e) => setTableNumber(Number(e.target.value))}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    {isEdit && (
                        <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                            <span className="text-sm text-zinc-300">Aktif</span>
                            <button
                                onClick={() => setIsActive((v) => !v)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-violet-600' : 'bg-zinc-600'
                                    }`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    )}

                    {!isEdit && (
                        <p className="text-xs text-zinc-500 bg-zinc-800/60 rounded-xl px-4 py-3">
                            QR kodu masa oluþturulduktan sonra otomatik üretilir ve listeden indirilebilir.
                        </p>
                    )}

                    {error && <p className="text-sm text-red-400">{error}</p>}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-zinc-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        Ýptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluþtur'}
                    </button>
                </div>
            </div>
        </div>
    )
}