import { useState, useEffect, useCallback } from 'react'
import { tableApi } from '../../api/table.api'
import type { TableDto } from '../../types/index'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
/*
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
} */ 

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
    // TableForm bileşeninin return bloğunu tamamen değiştir
    return (
        <>
            <style>{`
                .tf-overlay {
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(50,50,50,0.45); padding: 16px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .tf-box {
                    width: 100%; max-width: 400px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 16px 6px 16px 6px / 6px 16px 6px 16px;
                    box-shadow: 6px 6px 0 #323232;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                    background-position: 0 40px;
                }
                .tf-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 18px 20px; border-bottom: 2px dashed #323232;
                }
                .tf-title {
                    font-size: 15px; font-weight: 900; color: #323232;
                    margin: 0; text-transform: uppercase;
                    transform: rotate(-1deg); display: inline-block;
                }
                .tf-close {
                    background: #ff6b6b; border: 2px solid #323232;
                    border-radius: 50%; width: 30px; height: 30px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: 2px 2px 0 #323232; transition: all 0.15s;
                    color: white; font-size: 14px; font-weight: bold;
                }
                .tf-close:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #323232; }
                .tf-input {
                    width: 100%; box-sizing: border-box;
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 10px 14px;
                    font-size: 14px; font-weight: 600;
                    color: #323232; background: #ffffff;
                    outline: none;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .tf-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    background: #fffdf5; transform: translate(-1px,-1px);
                }
                .tf-toggle-row {
                    display: flex; align-items: center; justify-content: space-between;
                    background: #ffffff; border: 2px solid #323232;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    padding: 12px 14px; box-shadow: 3px 3px 0 #323232;
                }
                .tf-btn-cancel {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffffff;
                    font-size: 13px; font-weight: 700; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .tf-btn-cancel:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; }
                .tf-btn-save {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #ffe66d;
                    font-size: 13px; font-weight: 900; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .tf-btn-save:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; background: #ffd700; }
                .tf-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
                .tf-field-label {
                    font-size: 11px; font-weight: 700; color: #5F7154;
                    display: block; margin-bottom: 6px;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    font-family: inherit;
                }
            `}</style>
            <div className="tf-overlay">
                <div className="tf-box">
                    <div className="tf-header">
                        <h2 className="tf-title">{isEdit ? '✏️ Masa Düzenle' : '✨ Yeni Masa Ekle'}</h2>
                        <button className="tf-close" onClick={onClose}>✕</button>
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label className="tf-field-label">Masa Numarası</label>
                            <input
                                type="number" min={1}
                                value={tableNumber}
                                onChange={e => setTableNumber(e.target.value)}
                                placeholder="Örn: 5"
                                className="tf-input"
                                autoFocus
                            />
                        </div>
                        {isEdit && (
                            <div className="tf-toggle-row">
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#323232', fontFamily: 'inherit' }}>Aktif</span>
                                <button
                                    onClick={() => setIsActive(!isActive)}
                                    style={{ width: '46px', height: '26px', borderRadius: '13px', border: '2px solid #323232', background: isActive ? '#4ecdc4' : '#ddd', cursor: 'pointer', position: 'relative', boxShadow: '2px 2px 0 #323232', transition: 'background 0.2s' }}
                                >
                                    <span style={{ position: 'absolute', top: '3px', left: isActive ? '22px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: '1.5px solid #323232', transition: 'left 0.2s' }} />
                                </button>
                            </div>
                        )}
                        {error && <p style={{ fontSize: '12px', fontWeight: 700, color: '#c0392b', background: '#ffecec', padding: '10px 12px', borderRadius: '8px', border: '2px solid #ff6b6b', boxShadow: '2px 2px 0 #ff6b6b', margin: 0, fontFamily: 'inherit' }}>⚠️ {error}</p>}
                    </div>
                    <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
                        <button className="tf-btn-cancel" onClick={onClose}>İptal</button>
                        <button className="tf-btn-save" onClick={handleSave} disabled={saving}>
                            {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle ✓' : 'Oluştur ✓'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )


}
// TableCard bileşenini tamamen değiştir
function TableCard({ table, onEdit, onDelete, onDownloadQr, downloading }: {
    table: TableDto
    onEdit: (t: TableDto) => void
    onDelete: (t: TableDto) => void
    onDownloadQr: (t: TableDto) => void
    downloading: boolean
}) {
    const [hovered, setHovered] = useState(false)
    return (
        <>
            <style>{`
                .tc-card {
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    padding: 16px;
                    display: flex; flex-direction: column; gap: 12px;
                    box-shadow: 4px 4px 0 #323232;
                    transition: all 0.15s;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    cursor: default;
                }
                .tc-card:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #323232; }
                .tc-card.passive { opacity: 0.6; }
                .tc-num {
                    font-size: 32px; font-weight: 900; color: #323232;
                    letter-spacing: -0.02em; line-height: 1;
                    font-family: monospace;
                }
                .tc-status {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 11px; font-weight: 700;
                    font-family: "Comic Sans MS", cursive;
                }
                .tc-qr-url {
                    font-size: 10px; color: #aaa;
                    font-family: monospace; margin: 0;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .tc-action-btn {
                    padding: 6px; border-radius: 6px 2px 6px 2px / 2px 6px 2px 6px;
                    border: 2px solid transparent; background: none;
                    cursor: pointer; display: flex; align-items: center;
                    transition: all 0.15s;
                }
                .tc-action-btn.edit:hover { background: #fff9e6; border-color: #323232; box-shadow: 2px 2px 0 #323232; transform: translate(-1px,-1px); }
                .tc-action-btn.del:hover { background: #ffecec; border-color: #ff6b6b; box-shadow: 2px 2px 0 #ff6b6b; transform: translate(-1px,-1px); }
                .tc-qr-btn {
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    width: 100%; padding: 9px;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    border: 2px solid #323232; background: #ffffff;
                    font-size: 12px; font-weight: 700; color: #5F7154;
                    cursor: pointer; font-family: "Comic Sans MS", cursive;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .tc-qr-btn:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; background: #ffe66d; color: #323232; }
                .tc-qr-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                @keyframes tc-spin { to { transform: rotate(360deg); } }
            `}</style>
            <div className={`tc-card${!table.isActive ? ' passive' : ''}`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <span className="tc-num">{table.tableNumber}</span>
                        <p className="tc-status" style={{ marginTop: '4px', color: table.isActive ? '#5F7154' : '#aaa' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: table.isActive ? '#4ecdc4' : '#ccc', display: 'inline-block', border: '1.5px solid #323232' }} />
                            {table.isActive ? 'Aktif' : 'Pasif'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <button className="tc-action-btn edit" onClick={() => onEdit(table)}>
                            <Pencil size={13} color="#5F7154" />
                        </button>
                        <button className="tc-action-btn del" onClick={() => onDelete(table)}>
                            <Trash2 size={13} color="#c0392b" />
                        </button>
                    </div>
                </div>

                <p className="tc-qr-url">{table.qRCodeUrl}</p>

                <button
                    className="tc-qr-btn"
                    onClick={() => onDownloadQr(table)}
                    disabled={downloading}
                >
                    {downloading
                        ? <span style={{ width: '12px', height: '12px', border: '2px solid #ccc', borderTopColor: '#5F7154', borderRadius: '50%', animation: 'tc-spin 0.8s linear infinite', display: 'inline-block' }} />
                        : <Download size={12} />
                    }
                    QR İndir
                </button>
            </div>
        </>
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

    // TableManagement return bloğunu tamamen değiştir
    return (
        <>
            <style>{`
                .tm-page {
                    padding: 32px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    max-width: 900px; min-height: 100vh;
                    background: #FFF5F7;
                    background-image: repeating-linear-gradient(
                        transparent, transparent 27px,
                        rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 29px
                    );
                }
                .tm-page-title {
                    font-size: 26px; font-weight: 900; color: #323232;
                    margin: 0 0 4px; transform: rotate(-1deg);
                    display: inline-block; text-transform: uppercase;
                }
                .tm-page-sub { font-size: 12px; color: #888; margin: 0; font-style: italic; }
                .tm-add-btn {
                    display: flex; align-items: center; gap: 7px;
                    padding: 10px 18px;
                    border-radius: 12px 4px 12px 4px / 4px 12px 4px 12px;
                    border: 2px solid #323232; background: #ffe66d;
                    color: #323232; font-size: 13px; font-weight: 900;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 4px 4px 0 #323232; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .tm-add-btn:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #323232; background: #ffd700; }
                .tm-section-title {
                    font-size: 11px; font-weight: 700; color: #888;
                    text-transform: uppercase; letter-spacing: 0.1em;
                    margin: 0 0 12px; font-family: inherit;
                }
                .tm-empty {
                    padding: 60px 20px; border: 2px dashed #ccc;
                    border-radius: 16px; text-align: center;
                    color: #aaa; font-size: 14px; font-weight: 700;
                    background: #fffdf5; font-family: inherit;
                }
                .tm-delete-overlay {
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(50,50,50,0.45); padding: 16px;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                }
                .tm-delete-box {
                    width: 100%; max-width: 360px;
                    background: #fff9e6;
                    border: 2px solid #323232;
                    border-radius: 16px 6px 16px 6px / 6px 16px 6px 16px;
                    box-shadow: 6px 6px 0 #323232;
                    padding: 28px 24px; text-align: center;
                }
                .tm-delete-title { font-size: 17px; font-weight: 900; color: #323232; margin: 0 0 8px; text-transform: uppercase; }
                .tm-delete-desc { font-size: 13px; color: #666; margin: 0 0 22px; line-height: 1.6; }
                .tm-btn-cancel {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #323232; background: #fff;
                    font-size: 13px; font-weight: 700; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #323232; transition: all 0.15s;
                }
                .tm-btn-cancel:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #323232; }
                .tm-btn-del {
                    flex: 1; padding: 11px;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    border: 2px solid #c0392b; background: #ff6b6b;
                    font-size: 13px; font-weight: 900; color: #fff;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 3px 3px 0 #c0392b; transition: all 0.15s;
                    text-transform: uppercase;
                }
                .tm-btn-del:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #c0392b; }
                .tm-btn-del:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>

            <div className="tm-page">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <h1 className="tm-page-title">🪑 Masa & QR</h1>
                        <p className="tm-page-sub">{active.length} aktif · {inactive.length} pasif masa</p>
                    </div>
                    <button className="tm-add-btn" onClick={() => { setEditTarget(null); setShowForm(true) }}>
                        <Plus size={15} /> Masa Ekle
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
                        <span style={{ fontSize: '36px', animation: 'cat-bounce 1s ease-in-out infinite' }}>☕</span>
                        <p style={{ color: '#888', fontSize: '14px', fontWeight: 700, fontStyle: 'italic' }}>Yükleniyor…</p>
                        <style>{`@keyframes cat-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
                    </div>
                ) : tables.length === 0 ? (
                    <div className="tm-empty">
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🪑</div>
                        Henüz masa eklenmemiş.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {active.length > 0 && (
                            <section>
                                <h2 className="tm-section-title">Aktif Masalar · {active.length}</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                                    {active.map(table => (
                                        <TableCard key={table.id} table={table}
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
                                <h2 className="tm-section-title">Pasif Masalar · {inactive.length}</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                                    {inactive.map(table => (
                                        <TableCard key={table.id} table={table}
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
            </div>

            {showForm && <TableForm initial={editTarget} onDone={handleFormDone} onClose={() => { setShowForm(false); setEditTarget(null) }} />}

            {deleteTarget && (
                <div className="tm-delete-overlay">
                    <div className="tm-delete-box">
                        <div style={{ width: '56px', height: '56px', background: '#ffecec', border: '2px solid #ff6b6b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '26px', boxShadow: '3px 3px 0 #ff6b6b' }}>🗑️</div>
                        <h2 className="tm-delete-title">Emin misin?</h2>
                        <p className="tm-delete-desc">Masa {deleteTarget.tableNumber} ve tüm verileri kalıcı silinecek.</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="tm-btn-cancel" onClick={() => setDeleteTarget(null)}>Vazgeç</button>
                            <button className="tm-btn-del" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Siliniyor…' : 'Sil! 🗑️'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}