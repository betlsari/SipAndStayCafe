import { useState, useEffect, useCallback } from 'react'
import { categoryApi } from '../../api/category.api'
import type { CategoryDto } from '../../types/index'
import { Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

interface FormState {
    name: string
    displayOrder: string
    isActive: boolean
}

const EMPTY: FormState = { name: '', displayOrder: '0', isActive: true }

function CategoryRow({ cat, onEdit, onDelete }: {
    cat: CategoryDto
    onEdit: (cat: CategoryDto) => void
    onDelete: (cat: CategoryDto) => void
}) {
    const [hovered, setHovered] = useState(false)
    return (
        <>
            <style>{`
                .cat-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    padding: 12px 16px;
                    transition: all 0.15s;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    position: relative;
                    box-shadow: 3px 3px 0 #323232;
                }
                .cat-row:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 5px 5px 0 #323232;
                }
                .cat-row-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #323232;
                    margin: 0;
                }
                .cat-row-sub {
                    font-size: 11px;
                    color: #888;
                    margin: 2px 0 0;
                    font-style: italic;
                }
                .cat-passive-badge {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 20px;
                    background: #f0f0f0;
                    color: #888;
                    border: 1.5px solid #ccc;
                    font-family: inherit;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .cat-action-btn {
                    padding: 6px;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    border: 2px solid transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                    background: none;
                }
                .cat-action-btn:hover {
                    border-color: #323232;
                    box-shadow: 2px 2px 0 #323232;
                    transform: translate(-1px, -1px);
                }
                .cat-action-btn.edit:hover { background: #fff9e6; }
                .cat-action-btn.del:hover { background: #ffecec; border-color: #ff6b6b; box-shadow: 2px 2px 0 #ff6b6b; }
            `}</style>
            <div
                className="cat-row"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <GripVertical size={14} color="#ccc" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p className="cat-row-name">{cat.name}</p>
                        {!cat.isActive && <span className="cat-passive-badge">Pasif</span>}
                    </div>
                    <p className="cat-row-sub">Sıra: {cat.displayOrder}</p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.15s',
                }}>
                    <button className="cat-action-btn edit" onClick={() => onEdit(cat)}>
                        <Pencil size={13} color="#5F7154" />
                    </button>
                    <button className="cat-action-btn del" onClick={() => onDelete(cat)}>
                        <Trash2 size={13} color="#c0392b" />
                    </button>
                </div>
            </div>
        </>
    )
}

interface CategoryFormProps {
    initial?: CategoryDto | null
    onDone: () => void
    onClose: () => void
}

function CategoryForm({ initial, onDone, onClose }: CategoryFormProps) {
    const isEdit = !!initial
    const [form, setForm] = useState<FormState>(
        initial
            ? { name: initial.name, displayOrder: String(initial.displayOrder), isActive: initial.isActive }
            : EMPTY
    )
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const set = (key: keyof FormState, value: string | boolean) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Kategori adı zorunludur.'); return }
        setSaving(true)
        setError(null)
        try {
            if (isEdit && initial) {
                await categoryApi.update(initial.id, {
                    name: form.name.trim(),
                    displayOrder: parseInt(form.displayOrder) || 0,
                    isActive: form.isActive,
                })
                toast.success('Kategori güncellendi.')
            } else {
                await categoryApi.create({
                    name: form.name.trim(),
                    displayOrder: parseInt(form.displayOrder) || 0,
                })
                toast.success('Kategori oluşturuldu.')
            }
            onDone()
        } catch {
            setError('İşlem başarısız.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <style>{`
                .cat-modal-overlay {
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(50, 50, 50, 0.45);
                    padding: 16px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .cat-modal-box {
                    width: 100%; max-width: 440px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 16px 6px 16px 6px / 6px 16px 6px 16px;
                    box-shadow: 6px 6px 0 #323232;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.05) 27px, rgba(0,0,0,0.05) 29px
                    );
                    background-position: 0 40px;
                }
                .cat-modal-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 18px 20px;
                    border-bottom: 2px dashed #323232;
                }
                .cat-modal-title {
                    font-size: 16px; font-weight: 900; color: #323232;
                    margin: 0; text-transform: uppercase; letter-spacing: 0.5px;
                    transform: rotate(-1deg); display: inline-block;
                }
                .cat-modal-close {
                    background: #ff6b6b; border: 2px solid #323232;
                    border-radius: 50%; width: 30px; height: 30px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: 2px 2px 0 #323232;
                    transition: all 0.15s; color: white; font-size: 14px; font-weight: bold;
                }
                .cat-modal-close:hover {
                    transform: translate(-1px, -1px);
                    box-shadow: 3px 3px 0 #323232;
                }
                .cat-modal-body {
                    padding: 20px; display: flex; flex-direction: column; gap: 16px;
                }
                .cat-field-label {
                    font-size: 11px; font-weight: 700; color: #5F7154;
                    display: block; margin-bottom: 6px;
                    text-transform: uppercase; letter-spacing: 0.08em;
                }
                .cat-input {
                    width: 100%; box-sizing: border-box;
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 10px 14px;
                    font-size: 14px; font-weight: 600;
                    color: #323232; background: #ffffff;
                    outline: none; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s;
                }
                .cat-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    background: #fffdf5;
                    transform: translate(-1px, -1px);
                }
                .cat-toggle-row {
                    display: flex; align-items: center; justify-content: space-between;
                    background: #ffffff; border: 2px solid #323232;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    padding: 12px 14px;
                    box-shadow: 3px 3px 0 #323232;
                }
                .cat-toggle-label {
                    font-size: 13px; font-weight: 700; color: #323232;
                }
                .cat-toggle-btn {
                    width: 46px; height: 26px; border-radius: 13px;
                    border: 2px solid #323232; cursor: pointer;
                    position: relative; transition: background 0.2s;
                    box-shadow: 2px 2px 0 #323232;
                }
                .cat-toggle-handle {
                    position: absolute; top: 3px;
                    width: 16px; height: 16px;
                    border-radius: 50%; background: #fff;
                    border: 1.5px solid #323232;
                    transition: left 0.2s;
                }
                .cat-error-box {
                    font-size: 12px; font-weight: 700; color: #c0392b;
                    background: #ffecec; padding: 10px 12px;
                    border-radius: 8px; border: 2px solid #ff6b6b;
                    box-shadow: 2px 2px 0 #ff6b6b; margin: 0;
                    font-family: inherit;
                }
                .cat-modal-footer {
                    padding: 0 20px 20px;
                    display: flex; gap: 10px;
                }
                .cat-btn-cancel {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffffff;
                    font-size: 13px; font-weight: 700; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s;
                }
                .cat-btn-cancel:hover {
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0 #323232;
                }
                .cat-btn-save {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffe66d;
                    font-size: 13px; font-weight: 900; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .cat-btn-save:hover:not(:disabled) {
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0 #323232;
                    background: #ffd700;
                }
                .cat-btn-save:disabled {
                    opacity: 0.6; cursor: not-allowed;
                }
            `}</style>
            <div className="cat-modal-overlay">
                <div className="cat-modal-box">
                    <div className="cat-modal-header">
                        <h2 className="cat-modal-title">
                            {isEdit ? '✏️ Kategoriyi Düzenle' : '✨ Yeni Kategori'}
                        </h2>
                        <button className="cat-modal-close" onClick={onClose}>
                            <X size={14} />
                        </button>
                    </div>

                    <div className="cat-modal-body">
                        <div>
                            <label className="cat-field-label">Kategori Adı</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="Örn: Sıcak İçecekler"
                                className="cat-input"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="cat-field-label">Sıralama</label>
                            <input
                                type="number"
                                value={form.displayOrder}
                                onChange={e => set('displayOrder', e.target.value)}
                                className="cat-input"
                            />
                        </div>
                        {isEdit && (
                            <div className="cat-toggle-row">
                                <span className="cat-toggle-label">Aktif</span>
                                <button
                                    className="cat-toggle-btn"
                                    style={{ background: form.isActive ? '#4ecdc4' : '#ddd' }}
                                    onClick={() => set('isActive', !form.isActive)}
                                >
                                    <span
                                        className="cat-toggle-handle"
                                        style={{ left: form.isActive ? '22px' : '3px' }}
                                    />
                                </button>
                            </div>
                        )}
                        {error && <p className="cat-error-box">⚠️ {error}</p>}
                    </div>

                    <div className="cat-modal-footer">
                        <button className="cat-btn-cancel" onClick={onClose}>İptal</button>
                        <button className="cat-btn-save" onClick={handleSave} disabled={saving}>
                            {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle ✓' : 'Oluştur ✓'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<CategoryDto[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<CategoryDto | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchCategories = useCallback(async () => {
        try {
            const res = await categoryApi.getAll()
            setCategories(res.data.sort((a, b) => a.displayOrder - b.displayOrder))
        } catch {
            toast.error('Kategoriler yüklenemedi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const load = async () => { await fetchCategories() }
        load()
    }, [fetchCategories])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await categoryApi.delete(deleteTarget.id)
            toast.success('Kategori silindi.')
            setDeleteTarget(null)
            fetchCategories()
        } catch {
            toast.error('Silme işlemi başarısız.')
        } finally {
            setDeleting(false)
        }
    }

    const handleFormDone = () => {
        setShowForm(false)
        setEditTarget(null)
        fetchCategories()
    }

    return (
        <>
            <style>{`
                .cat-page {
                    padding: 32px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    max-width: 760px;
                    min-height: 100vh;
                    background: #FFF5F7;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                }
                .cat-page-header {
                    display: flex; align-items: flex-start;
                    justify-content: space-between; margin-bottom: 28px;
                }
                .cat-page-title {
                    font-size: 26px; font-weight: 900; color: #323232;
                    margin: 0 0 4px; transform: rotate(-1deg);
                    display: inline-block; text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .cat-page-sub {
                    font-size: 12px; color: #888; margin: 0; font-style: italic;
                }
                .cat-add-btn {
                    display: flex; align-items: center; gap: 7px;
                    padding: 10px 18px;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    border: 2px solid #323232; background: #ffe66d;
                    color: #323232; font-size: 13px; font-weight: 900;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 4px 4px 0 #323232;
                    transition: all 0.15s; text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .cat-add-btn:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0 #323232;
                    background: #ffd700;
                }
                .cat-loading {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    height: 200px; gap: 12px;
                }
                .cat-loading-emoji {
                    font-size: 36px; animation: cat-bounce 1s ease-in-out infinite;
                }
                @keyframes cat-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .cat-loading-text {
                    font-size: 14px; color: #888; font-weight: 700;
                    font-style: italic; font-family: inherit;
                }
                .cat-empty {
                    padding: 60px 20px;
                    border: 2px dashed #ccc;
                    border-radius: 16px; text-align: center;
                    color: #aaa; font-size: 14px; font-weight: 700;
                    background: #fffdf5; font-family: inherit;
                }
                .cat-list {
                    display: flex; flex-direction: column; gap: 10px;
                }
                .cat-delete-overlay {
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(50,50,50,0.45); padding: 16px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .cat-delete-box {
                    width: 100%; max-width: 360px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 16px 6px 16px 6px / 6px 16px 6px 16px;
                    box-shadow: 6px 6px 0 #323232;
                    padding: 28px 24px; text-align: center;
                }
                .cat-delete-icon {
                    width: 56px; height: 56px;
                    background: #ffecec; border: 2px solid #ff6b6b;
                    border-radius: 50%; display: flex; align-items: center;
                    justify-content: center; margin: 0 auto 16px;
                    font-size: 26px; box-shadow: 3px 3px 0 #ff6b6b;
                }
                .cat-delete-title {
                    font-size: 17px; font-weight: 900; color: #323232; margin: 0 0 8px;
                    text-transform: uppercase;
                }
                .cat-delete-desc {
                    font-size: 13px; color: #666; margin: 0 0 22px; line-height: 1.6;
                }
                .cat-delete-actions {
                    display: flex; gap: 10px;
                }
                .cat-btn-cancel-del {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #fff;
                    font-size: 13px; font-weight: 700; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .cat-btn-cancel-del:hover {
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0 #323232;
                }
                .cat-btn-del-confirm {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #c0392b; background: #ff6b6b;
                    font-size: 13px; font-weight: 900; color: #fff;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #c0392b; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .cat-btn-del-confirm:hover:not(:disabled) {
                    transform: translate(-1px, -1px);
                    box-shadow: 4px 4px 0 #c0392b;
                }
                .cat-btn-del-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>

            <div className="cat-page">
                <div className="cat-page-header">
                    <div>
                        <h1 className="cat-page-title">🏷️ Kategoriler</h1>
                        <p className="cat-page-sub">{categories.length} kategori kayıtlı</p>
                    </div>
                    <button
                        className="cat-add-btn"
                        onClick={() => { setEditTarget(null); setShowForm(true) }}
                    >
                        <Plus size={15} />
                        Ekle
                    </button>
                </div>

                {loading ? (
                    <div className="cat-loading">
                        <span className="cat-loading-emoji">☕</span>
                        <p className="cat-loading-text">Yükleniyor…</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="cat-empty">
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏷️</div>
                        Henüz kategori eklenmemiş.
                    </div>
                ) : (
                    <div className="cat-list">
                        {categories.map(cat => (
                            <CategoryRow
                                key={cat.id}
                                cat={cat}
                                onEdit={c => { setEditTarget(c); setShowForm(true) }}
                                onDelete={setDeleteTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <CategoryForm
                    initial={editTarget}
                    onDone={handleFormDone}
                    onClose={() => { setShowForm(false); setEditTarget(null) }}
                />
            )}

            {deleteTarget && (
                <div className="cat-delete-overlay">
                    <div className="cat-delete-box">
                        <div className="cat-delete-icon">🗑️</div>
                        <h2 className="cat-delete-title">Emin misin?</h2>
                        <p className="cat-delete-desc">
                            <strong>"{deleteTarget.name}"</strong> kategorisi kalıcı olarak silinecek.
                        </p>
                        <div className="cat-delete-actions">
                            <button className="cat-btn-cancel-del" onClick={() => setDeleteTarget(null)}>
                                Vazgeç
                            </button>
                            <button
                                className="cat-btn-del-confirm"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Siliniyor…' : 'Sil! 🗑️'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}