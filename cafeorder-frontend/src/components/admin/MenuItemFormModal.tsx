import { useState, useEffect } from 'react'
import { menuApi } from '../../api/menu.api'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import ModifierGroupSection from './ModifierGroupSection'
import type { MenuItemDto, CategoryDto } from '../../types/index'

interface Props {
    itemId: string | null
    categories: CategoryDto[]
    onSave: () => void
    onClose: () => void
}

interface FormState {
    name: string
    description: string
    basePrice: string
    categoryId: string
    imageUrl: string
    displayOrder: string
    isAvailable: boolean
}

const EMPTY: FormState = {
    name: '',
    description: '',
    basePrice: '',
    categoryId: '',
    imageUrl: '',
    displayOrder: '0',
    isAvailable: true,
}

export default function MenuItemFormModal({ itemId, categories, onSave, onClose }: Props) {
    const isEdit = itemId !== null
    const [form, setForm] = useState<FormState>(EMPTY)
    const [loadingItem, setLoadingItem] = useState(false)
    const [fullItem, setFullItem] = useState<MenuItemDto | null>(null)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isEdit) return;
        setLoadingItem(true)
        menuApi.getItemById(itemId)
            .then((res) => {
                const d = res.data
                setForm({
                    name: d.name,
                    description: d.description ?? '',
                    basePrice: String(d.basePrice),
                    categoryId: d.categoryId,
                    imageUrl: d.imageUrl ?? '',
                    displayOrder: String(d.displayOrder),
                    isAvailable: d.isAvailable,
                })
                setFullItem(res.data)

            })
            .catch(() => toast.error('Ürün yüklenemedi.'))
            .finally(() => setLoadingItem(false))
    }, [itemId])

    // Set default categoryId when categories change and not editing
    useEffect(() => {
        if (!isEdit && categories.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: categories[0]?.id ?? '' }))

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, isEdit])

    const set = (key: keyof FormState, value: string | boolean) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const handleSubmit = async () => {
        if (!form.name.trim()) { setError('Ürün adı zorunludur.'); return }
        if (!form.categoryId) { setError('Kategori seçimi zorunludur.'); return }
        const price = parseFloat(form.basePrice)
        if (isNaN(price) || price < 0) { setError('Geçerli bir fiyat girin.'); return }

        setSaving(true)
        setError(null)
        try {
            if (isEdit) {
                await menuApi.updateItem(itemId, {
                    name: form.name.trim(),
                    description: form.description || undefined,
                    basePrice: price,
                    categoryId: form.categoryId,
                    isAvailable: form.isAvailable,
                    imageUrl: form.imageUrl || undefined,
                    displayOrder: parseInt(form.displayOrder) || 0,
                })
                toast.success('Ürün güncellendi.')
            } else {
                await menuApi.createItem({
                    name: form.name.trim(),
                    description: form.description || undefined,
                    basePrice: price,
                    categoryId: form.categoryId,
                    imageUrl: form.imageUrl || undefined,
                    displayOrder: parseInt(form.displayOrder) || 0,
                })
                toast.success('Ürün oluşturuldu.')
            }
            onSave()
        } catch {
            setError('İşlem başarısız. Lütfen tekrar deneyin.')
        } finally {
            setSaving(false)
        }
    }
    const handleModifierRefresh = () => {
        if (!itemId) return
        menuApi.getItemById(itemId).then((res) => setFullItem(res.data)).catch(() => { })
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
                    <h2 className="text-base font-bold text-white">
                        {isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                {loadingItem ? (
                    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">Yükleniyor…</div>
                ) : (
                    <div className="overflow-y-auto px-5 py-5 flex flex-col gap-4">
                        {/* Name */}
                        <Field label="Ürün Adı">
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => set('name', e.target.value)}
                                placeholder="Örn: Sütlü Latte"
                                className={inputCls}
                            />
                        </Field>

                        {/* Description */}
                        <Field label="Açıklama (opsiyonel)">
                            <textarea
                                value={form.description}
                                onChange={(e) => set('description', e.target.value)}
                                placeholder="Kısa bir açıklama..."
                                rows={2}
                                className={`${inputCls} resize-none`}
                            />
                        </Field>

                        {/* Price + Order */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Fiyat (₺)">
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.basePrice}
                                    onChange={(e) => set('basePrice', e.target.value)}
                                    placeholder="0.00"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Sıralama">
                                <input
                                    type="number"
                                    value={form.displayOrder}
                                    onChange={(e) => set('displayOrder', e.target.value)}
                                    className={inputCls}
                                />
                            </Field>
                        </div>

                        {/* Category */}
                        <Field label="Kategori">
                            <select
                                value={form.categoryId}
                                onChange={(e) => set('categoryId', e.target.value)}
                                className={inputCls}
                            >
                                <option value="">Kategori seçin</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </Field>

                        {/* Image URL */}
                        <Field label="Görsel URL (opsiyonel)">
                            <input
                                type="text"
                                value={form.imageUrl}
                                onChange={(e) => set('imageUrl', e.target.value)}
                                placeholder="https://..."
                                className={inputCls}
                            />
                        </Field>

                        {/* isAvailable (edit only) */}
                        {isEdit && (
                            <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                                <span className="text-sm text-zinc-300">Stokta mevcut</span>
                                <button
                                    onClick={() => set('isAvailable', !form.isAvailable)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isAvailable ? 'bg-violet-600' : 'bg-zinc-600'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}
                            {isEdit && fullItem && (
                                <>
                                    <div className="border-t border-zinc-700 my-1" />
                                    <ModifierGroupSection item={fullItem} onRefresh={handleModifierRefresh} />
                                </>
                            )}
                        {error && <p className="text-sm text-red-400">{error}</p>}
                    </div>
                )}

                {/* Footer */}
                <div className="px-5 py-4 border-t border-zinc-800 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || loadingItem}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>
            {children}
        </div>
    )
}