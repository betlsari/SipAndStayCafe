import { useState, useEffect, useCallback } from 'react'
import { categoryApi } from '../../api/category.api'
import type { CategoryDto } from '../../types/index'
import { Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react'
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
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#FFFFFF',
                border: '1px solid #E8E4DC',
                borderRadius: '12px',
                padding: '12px 16px',
                transition: 'border-color 0.15s',
                borderColor: hovered ? '#C8D5C0' : '#E8E4DC',
            }}
        >
            <GripVertical size={14} color="#C8D5C0" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C3528', margin: 0 }}>{cat.name}</p>
                    {!cat.isActive && (
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '20px',
                            background: '#F0ECE4',
                            color: '#9A8E80',
                        }}>Pasif</span>
                    )}
                </div>
                <p style={{ fontSize: '12px', color: '#B0AB9E', margin: '2px 0 0' }}>Sıra: {cat.displayOrder}</p>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.15s',
            }}>
                <button
                    onClick={() => onEdit(cat)}
                    style={{
                        padding: '6px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#F0F4EC',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Pencil size={13} color="#5F7154" />
                </button>
                <button
                    onClick={() => onDelete(cat)}
                    style={{
                        padding: '6px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#FAE8EE',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Trash2 size={13} color="#C06080" />
                </button>
            </div>
        </div>
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
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(44,53,40,0.35)',
            padding: '16px',
            fontFamily: 'system-ui, sans-serif',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: '#FDFCF9',
                borderRadius: '20px',
                border: '1px solid #E0DDD6',
                boxShadow: '0 8px 32px rgba(95,113,84,0.12)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    borderBottom: '1px solid #EDE9E0',
                }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#2C3528', margin: 0 }}>
                        {isEdit ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
                    </h2>
                    <button onClick={onClose} style={{ background: '#F0ECE4', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} color="#6A6560" />
                    </button>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#5F7154', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kategori Adı</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="Örn: Sıcak İçecekler"
                            style={inputStyle}
                            autoFocus
                            onFocus={e => (e.target.style.borderColor = '#82A76B')}
                            onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#5F7154', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sıralama</label>
                        <input
                            type="number"
                            value={form.displayOrder}
                            onChange={e => set('displayOrder', e.target.value)}
                            style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = '#82A76B')}
                            onBlur={e => (e.target.style.borderColor = '#E0DDD6')}
                        />
                    </div>
                    {isEdit && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#F7F5F0',
                            border: '1px solid #E8E4DC',
                            borderRadius: '10px',
                            padding: '12px 14px',
                        }}>
                            <span style={{ fontSize: '13px', color: '#4A4840' }}>Aktif</span>
                            <button
                                onClick={() => set('isActive', !form.isActive)}
                                style={{
                                    width: '42px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: form.isActive ? '#5F7154' : '#D8D4CC',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <span style={{
                                    position: 'absolute',
                                    top: '3px',
                                    left: form.isActive ? '21px' : '3px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#fff',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                }} />
                            </button>
                        </div>
                    )}
                    {error && (
                        <p style={{ fontSize: '13px', color: '#C06080', background: '#FAE8EE', padding: '10px 12px', borderRadius: '8px', margin: 0 }}>{error}</p>
                    )}
                </div>

                <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '11px',
                            borderRadius: '11px',
                            border: '1px solid #E0DDD6',
                            background: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#6A6560',
                            cursor: 'pointer',
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    >İptal</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            flex: 1,
                            padding: '11px',
                            borderRadius: '11px',
                            border: 'none',
                            background: saving ? '#8FAF80' : '#5F7154',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#FFFFFF',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontFamily: 'system-ui, sans-serif',
                            transition: 'background 0.15s',
                        }}
                    >{saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}</button>
                </div>
            </div>
        </div>
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
        <div style={{
            padding: '32px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            maxWidth: '760px',
            background: '#F7F5F0',
            minHeight: '100vh',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2C3528', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Kategoriler</h1>
                    <p style={{ fontSize: '13px', color: '#9A8E80', margin: 0 }}>{categories.length} kategori kayıtlı</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setShowForm(true) }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#5F7154',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'system-ui, sans-serif',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#4A5C40')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#5F7154')}
                >
                    <Plus size={14} />
                    Kategori Ekle
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>☕</div>
                    <p style={{ color: '#9A8E80', fontSize: '13px' }}>Yükleniyor…</p>
                </div>
            ) : categories.length === 0 ? (
                <div style={{
                    padding: '60px 20px',
                    border: '1.5px dashed #D8D4CC',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: '#B0AB9E',
                    fontSize: '14px',
                    background: '#FDFCF9',
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏷️</div>
                    Henüz kategori eklenmemiş.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

            {showForm && (
                <CategoryForm
                    initial={editTarget}
                    onDone={handleFormDone}
                    onClose={() => { setShowForm(false); setEditTarget(null) }}
                />
            )}

            {deleteTarget && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(44,53,40,0.35)',
                    padding: '16px',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '360px',
                        background: '#FDFCF9',
                        borderRadius: '20px',
                        border: '1px solid #E0DDD6',
                        padding: '28px 24px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            background: '#FAE8EE',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <Trash2 size={22} color="#C06080" />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3528', margin: '0 0 8px' }}>Kategoriyi Sil?</h2>
                        <p style={{ fontSize: '13px', color: '#8A8478', margin: '0 0 22px', lineHeight: 1.5 }}>
                            <strong style={{ color: '#2C3528' }}>"{deleteTarget.name}"</strong> kategorisi kalıcı olarak silinecek.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: '1px solid #E0DDD6', background: '#FFFFFF', fontSize: '13px', fontWeight: 500, color: '#6A6560', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}>Vazgeç</button>
                            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: 'none', background: deleting ? '#E8B0C0' : '#C06080', fontSize: '13px', fontWeight: 500, color: '#FFFFFF', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, sans-serif' }}>
                                {deleting ? 'Siliniyor…' : 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}