import { useState } from 'react'
import { categoryApi } from '../../api/category.api'
import type { CategoryDto } from '../../types/index'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    category: CategoryDto | null
    onSave: () => void
    onClose: () => void
}

export default function CategoryFormModal({ category, onSave, onClose }: Props) {
    const isEdit = category !== null


    const [name, setName] = useState(() => category?.name ?? '')
    const [displayOrder, setDisplayOrder] = useState(() => category?.displayOrder ?? 0)
    const [isActive, setIsActive] = useState(() => category?.isActive ?? true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    

    const handleSubmit = async () => {
        if (!name.trim()) { setError('Kategori adý zorunludur.'); return }
        setLoading(true)
        setError(null)
        try {
            if (isEdit) {
                await categoryApi.update(category.id, { name: name.trim(), displayOrder, isActive })
                toast.success('Kategori güncellendi.')
            } else {
                await categoryApi.create({ name: name.trim(), displayOrder })
                toast.success('Kategori oluþturuldu.')
            }
            onSave()
        } catch {
            setError('Ýþlem baþarýsýz. Lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-base font-bold text-white">
                        {isEdit ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kategori Adý</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Örn: Sýcak Ýçecekler"
                            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sýralama</label>
                        <input
                            type="number"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(Number(e.target.value))}
                            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    {isEdit && (
                        <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                            <span className="text-sm text-zinc-300">Aktif</span>
                            <button
                                onClick={() => setIsActive((v) => !v)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-violet-600' : 'bg-zinc-600'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
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
                        disabled={loading}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        {loading ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluþtur'}
                    </button>
                </div>
            </div>
        </div>
    )
}