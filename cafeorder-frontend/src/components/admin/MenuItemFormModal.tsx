import { useState, useEffect } from 'react'
import { menuApi } from '../../api/menu.api'
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


    // MenuItemFormModal return bloğunu tamamen değiştir
    return (
        <>
            <style>{`
                .mf-overlay {
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(50,50,50,0.45); padding: 16px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .mf-box {
                    width: 100%; max-width: 512px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 16px 6px 16px 6px / 6px 16px 6px 16px;
                    box-shadow: 6px 6px 0 #323232;
                    display: flex; flex-direction: column;
                    max-height: 90vh;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                    background-position: 0 40px;
                }
                .mf-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 18px 20px;
                    border-bottom: 2px dashed #323232;
                    flex-shrink: 0;
                }
                .mf-title {
                    font-size: 15px; font-weight: 900; color: #323232;
                    margin: 0; text-transform: uppercase; letter-spacing: 0.5px;
                    transform: rotate(-1deg); display: inline-block;
                }
                .mf-close {
                    background: #ff6b6b; border: 2px solid #323232;
                    border-radius: 50%; width: 30px; height: 30px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: 2px 2px 0 #323232; transition: all 0.15s;
                    color: white; font-size: 14px; font-weight: bold;
                }
                .mf-close:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #323232; }
                .mf-input {
                    width: 100%; box-sizing: border-box;
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 9px 14px;
                    font-size: 14px; font-weight: 600;
                    color: #323232; background: #ffffff;
                    outline: none;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s;
                }
                .mf-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    background: #fffdf5;
                    transform: translate(-1px,-1px);
                }
                .mf-toggle-row {
                    display: flex; align-items: center; justify-content: space-between;
                    background: #ffffff; border: 2px solid #323232;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    padding: 12px 14px;
                    box-shadow: 3px 3px 0 #323232;
                }
                .mf-footer {
                    padding: 14px 20px;
                    border-top: 2px dashed #323232;
                    display: flex; gap: 10px; flex-shrink: 0;
                }
                .mf-btn-cancel {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffffff;
                    font-size: 13px; font-weight: 700; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .mf-btn-cancel:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; }
                .mf-btn-save {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffe66d;
                    font-size: 13px; font-weight: 900; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .mf-btn-save:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; background: #ffd700; }
                .mf-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
                .mf-divider { border: none; border-top: 2px dashed #323232; margin: 4px 0; }
            `}</style>

            <div className="mf-overlay">
                <div className="mf-box">
                    <div className="mf-header">
                        <h2 className="mf-title">{isEdit ? '✏️ Ürünü Düzenle' : '✨ Yeni Ürün'}</h2>
                        <button className="mf-close" onClick={onClose}>✕</button>
                    </div>

                    {loadingItem ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '8px', fontFamily: 'inherit' }}>
                            <span style={{ fontSize: '28px' }}>☕</span>
                            <p style={{ color: '#888', fontSize: '13px', fontWeight: 700, fontStyle: 'italic' }}>Yükleniyor…</p>
                        </div>
                    ) : (
                        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <Field label="Ürün Adı">
                                <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Örn: Sütlü Latte" className={inputCls} />
                            </Field>
                            <Field label="Açıklama (opsiyonel)">
                                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Kısa bir açıklama..." rows={2} className={inputCls} style={{ resize: 'none' }} />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <Field label="Fiyat (₺)">
                                    <input type="number" min={0} step={0.01} value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} placeholder="0.00" className={inputCls} />
                                </Field>
                                <Field label="Sıralama">
                                    <input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} className={inputCls} />
                                </Field>
                            </div>
                            <Field label="Kategori">
                                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputCls}>
                                    <option value="">Kategori seçin</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Görsel URL (opsiyonel)">
                                <input type="text" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." className={inputCls} />
                            </Field>
                            {isEdit && (
                                <div className="mf-toggle-row">
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#323232' }}>Stokta mevcut</span>
                                    <button
                                        onClick={() => set('isAvailable', !form.isAvailable)}
                                        style={{ width: '46px', height: '26px', borderRadius: '13px', border: '2px solid #323232', cursor: 'pointer', position: 'relative', background: form.isAvailable ? '#4ecdc4' : '#ddd', boxShadow: '2px 2px 0 #323232', transition: 'background 0.2s' }}
                                    >
                                        <span style={{ position: 'absolute', top: '3px', left: form.isAvailable ? '22px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: '1.5px solid #323232', transition: 'left 0.2s' }} />
                                    </button>
                                </div>
                            )}
                            {isEdit && fullItem && (
                                <>
                                    <hr className="mf-divider" />
                                    <ModifierGroupSection item={fullItem} onRefresh={handleModifierRefresh} />
                                </>
                            )}
                            {error && (
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#c0392b', background: '#ffecec', padding: '10px 12px', borderRadius: '8px', border: '2px solid #ff6b6b', boxShadow: '2px 2px 0 #ff6b6b', margin: 0 }}>⚠️ {error}</p>
                            )}
                        </div>
                    )}

                    <div className="mf-footer">
                        <button className="mf-btn-cancel" onClick={onClose}>İptal</button>
                        <button className="mf-btn-save" onClick={handleSubmit} disabled={saving || loadingItem}>
                            {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle ✓' : 'Oluştur ✓'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// inputCls sabitini güncelle
const inputCls = 'mf-input'

// Field bileşenini güncelle
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#5F7154', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Comic Sans MS", cursive' }}>{label}</label>
            {children}
        </div>
    )
}