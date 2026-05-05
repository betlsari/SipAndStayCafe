import { useState } from 'react'
import { menuApi } from '../../api/menu.api'
import type { MenuItemDto, ModifierGroupDto, ModifierDto } from '../../types/index'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    item: MenuItemDto
    onRefresh: () => void
}

// inputCls sabitini güncelle (dosyanın başındaki)
const inputCls = 'mg-input'
// ── Inline Group Form ─────────────────────────────────────────────────────────
function GroupForm({
    itemId,
    group,
    onDone,
}: {
    itemId: string
    group: ModifierGroupDto | null
    onDone: () => void
}) {
    const isEdit = group !== null
    const [name, setName] = useState(group?.name ?? '')
    const [selectionType, setSelectionType] = useState<'Single' | 'Multi'>(
        (group?.selectionType as 'Single' | 'Multi') ?? 'Single'
    )
    const [isRequired, setIsRequired] = useState(group?.isRequired ?? false)
    const [displayOrder, setDisplayOrder] = useState(group?.displayOrder ?? 0)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Grup adı zorunludur.'); return }
        setSaving(true)
        try {
            if (isEdit) {
                await menuApi.updateModifierGroup(group.id, { name: name.trim(), selectionType, isRequired, displayOrder })
                toast.success('Grup güncellendi.')
            } else {
                await menuApi.createModifierGroup({ menuItemId: itemId, name: name.trim(), selectionType, isRequired, displayOrder })
                toast.success('Grup oluşturuldu.')
            }
            onDone()
        } catch {
            toast.error('İşlem başarısız.')
        } finally {
            setSaving(false)
        }
    }

    // GroupForm return bloğunu tamamen değiştir
    return (
        <>
            <style>{`
                .mg-input {
                    width: 100%; box-sizing: border-box;
                    border: 2px solid #323232;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    padding: 8px 12px;
                    font-size: 13px; font-weight: 600;
                    color: #323232; background: #ffffff;
                    outline: none;
                    font-family: "Comic Sans MS", "Chalkboard SE", cursive;
                    box-shadow: 3px 3px 0 #323232;
                    transition: all 0.15s;
                }
                .mg-input:focus {
                    border-color: #ffe66d;
                    box-shadow: 3px 3px 0 #323232, 0 0 0 3px rgba(255,230,109,0.4);
                    background: #fffdf5;
                    transform: translate(-1px,-1px);
                }
                .mg-form-box {
                    background: #fffdf5; border: 2px solid #323232;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    padding: 12px; display: flex; flex-direction: column; gap: 10px;
                    box-shadow: 3px 3px 0 #323232;
                }
                .mg-btn-save {
                    display: flex; align-items: center; gap: 5px;
                    padding: 6px 12px;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                    border: 2px solid #323232; background: #ffe66d;
                    font-size: 12px; font-weight: 900; color: #323232;
                    cursor: pointer; font-family: inherit;
                    box-shadow: 2px 2px 0 #323232; transition: all 0.15s;
                }
                .mg-btn-save:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #323232; }
                .mg-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
                .mg-btn-icon {
                    padding: 5px; border-radius: 6px;
                    border: 2px solid transparent; background: none;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s; font-family: inherit;
                }
                .mg-btn-icon:hover { border-color: #323232; box-shadow: 2px 2px 0 #323232; transform: translate(-1px,-1px); }
                .mg-group-row {
                    background: #fff9e6; border: 2px solid #323232;
                    border-radius: 10px 4px 10px 4px / 4px 10px 4px 10px;
                    overflow: hidden; box-shadow: 3px 3px 0 #323232;
                }
                .mg-group-header {
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 12px;
                }
                .mg-group-header:hover { background: #fffdf5; }
                .mg-mod-row {
                    display: flex; align-items: center; gap: 8px;
                    padding: 8px 10px;
                    background: #fffdf5; border: 2px solid #32323215;
                    border-radius: 8px 3px 8px 3px / 3px 8px 3px 8px;
                }
                .mg-add-link {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 12px; font-weight: 700;
                    color: #5F7154; cursor: pointer;
                    font-family: "Comic Sans MS", cursive;
                    background: none; border: none;
                    transition: color 0.15s;
                }
                .mg-add-link:hover { color: #323232; }
                .mg-section-title {
                    font-size: 11px; font-weight: 700; color: #5F7154;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    font-family: "Comic Sans MS", cursive;
                }
                .mg-empty {
                    border: 2px dashed #ccc; border-radius: 10px;
                    padding: 20px; text-align: center;
                    color: #aaa; font-size: 12px; font-weight: 700;
                    font-family: "Comic Sans MS", cursive;
                    background: #fffdf5;
                }
                .mg-mods-container {
                    padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;
                    border-top: 2px dashed #32323230;
                }
            `}</style>
            <div className="mg-form-box">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Grup adı (Örn: Süt Seçimi)" className={inputCls} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <select value={selectionType} onChange={(e) => setSelectionType(e.target.value as 'Single' | 'Multi')} className={inputCls}>
                        <option value="Single">Tek Seçim</option>
                        <option value="Multi">Çoklu Seçim</option>
                    </select>
                    <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} placeholder="Sıra" className={inputCls} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#323232', cursor: 'pointer', fontFamily: '"Comic Sans MS", cursive' }}>
                        <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} style={{ accentColor: '#ffe66d', width: '14px', height: '14px' }} />
                        Zorunlu seçim
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={onDone} className="mg-btn-icon" style={{ color: '#888' }}>
                            <X className="w-4 h-4" />
                        </button>
                        <button onClick={handleSave} disabled={saving} className="mg-btn-save">
                            <Check className="w-3.5 h-3.5" />
                            {saving ? 'Kaydediliyor…' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// ── Inline Modifier Form ──────────────────────────────────────────────────────
function ModifierForm({
    groupId,
    modifier,
    onDone,
}: {
    groupId: string
    modifier: ModifierDto | null
    onDone: () => void
}) {
    const isEdit = modifier !== null
    const [name, setName] = useState(modifier?.name ?? '')
    const [additionalPrice, setAdditionalPrice] = useState(modifier?.additionalPrice ?? 0)
    const [displayOrder, setDisplayOrder] = useState(modifier?.displayOrder ?? 0)
    const [isActive, setIsActive] = useState(modifier?.isActive ?? true)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Seçenek adı zorunludur.'); return }
        setSaving(true)
        try {
            if (isEdit) {
                await menuApi.updateModifier(modifier.id, {
                    name: name.trim(),
                    additionalPrice,
                    displayOrder,
                    isActive,
                })
                toast.success('Seçenek güncellendi.')
            } else {
                await menuApi.createModifier({
                    modifierGroupId: groupId,
                    name: name.trim(),
                    additionalPrice,
                    displayOrder,
                })
                toast.success('Seçenek oluşturuldu.')
            }
            onDone()
        } catch {
            toast.error('İşlem başarısız.')
        } finally {
            setSaving(false)
        }
    }

    // ModifierForm return bloğunu tamamen değiştir
    return (
        <div className="mg-form-box" style={{ background: '#fffff5' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seçenek adı" className={inputCls} />
                <input type="number" min={0} step={0.01} value={additionalPrice} onChange={(e) => setAdditionalPrice(parseFloat(e.target.value) || 0)} placeholder="Ek fiyat (₺)" className={inputCls} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} placeholder="Sıra" className={inputCls} />
                {isEdit && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#323232', cursor: 'pointer', fontFamily: '"Comic Sans MS", cursive', padding: '0 4px' }}>
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: '#ffe66d', width: '14px', height: '14px' }} />
                        Aktif
                    </label>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button onClick={onDone} className="mg-btn-icon" style={{ color: '#888' }}>
                    <X className="w-4 h-4" />
                </button>
                <button onClick={handleSave} disabled={saving} className="mg-btn-save">
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
            </div>
        </div>
    )
}

// ── ModifierGroupSection (main) ───────────────────────────────────────────────
export default function ModifierGroupSection({ item, onRefresh }: Props) {
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
    const [showGroupForm, setShowGroupForm] = useState(false)
    const [editingGroup, setEditingGroup] = useState<ModifierGroupDto | null>(null)
    const [showModifierFormForGroup, setShowModifierFormForGroup] = useState<string | null>(null)
    const [editingModifier, setEditingModifier] = useState<{ groupId: string; modifier: ModifierDto } | null>(null)
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)
    const [deletingModifierId, setDeletingModifierId] = useState<string | null>(null)

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Bu modifier grubunu silmek istediğinize emin misiniz?')) return
        setDeletingGroupId(groupId)
        try {
            await menuApi.deleteModifierGroup(groupId)
            toast.success('Grup silindi.')
            onRefresh()
        } catch {
            toast.error('Grup silinemedi.')
        } finally {
            setDeletingGroupId(null)
        }
    }

    const handleDeleteModifier = async (modifierId: string) => {
        if (!confirm('Bu seçeneği silmek istediğinize emin misiniz?')) return
        setDeletingModifierId(modifierId)
        try {
            await menuApi.deleteModifier(modifierId)
            toast.success('Seçenek silindi.')
            onRefresh()
        } catch {
            toast.error('Seçenek silinemedi.')
        } finally {
            setDeletingModifierId(null)
        }
    }

    const handleGroupFormDone = () => {
        setShowGroupForm(false)
        setEditingGroup(null)
        onRefresh()
    }

    const handleModifierFormDone = () => {
        setShowModifierFormForGroup(null)
        setEditingModifier(null)
        onRefresh()
    }

    // ModifierGroupSection (main) return bloğunu tamamen değiştir
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mg-section-title">Modifier Grupları</span>
                {!showGroupForm && !editingGroup && (
                    <button onClick={() => { setEditingGroup(null); setShowGroupForm(true) }} className="mg-add-link">
                        <Plus className="w-3.5 h-3.5" />
                        Grup Ekle
                    </button>
                )}
            </div>

            {(showGroupForm && !editingGroup) && (
                <GroupForm itemId={item.id} group={null} onDone={handleGroupFormDone} />
            )}

            {item.modifierGroups.length === 0 && !showGroupForm && (
                <div className="mg-empty">Henüz modifier grubu yok.</div>
            )}

            {item.modifierGroups
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((group) => {
                    const isExpanded = expandedGroupId === group.id
                    const isEditingThisGroup = editingGroup?.id === group.id

                    return (
                        <div key={group.id} className="mg-group-row">
                            {isEditingThisGroup ? (
                                <div style={{ padding: '10px' }}>
                                    <GroupForm itemId={item.id} group={group} onDone={handleGroupFormDone} />
                                </div>
                            ) : (
                                <div className="mg-group-header">
                                    <button onClick={() => setExpandedGroupId(isExpanded ? null : group.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: '"Comic Sans MS", cursive' }}>
                                        {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: '#888', flexShrink: 0 }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#888', flexShrink: 0 }} />}
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#323232' }}>{group.name}</span>
                                        <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                                            {group.selectionType === 'Single' ? 'Tek' : 'Çoklu'}
                                            {group.isRequired ? ' · Zorunlu' : ''}
                                        </span>
                                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#aaa' }}>{group.modifiers.length} seçenek</span>
                                    </button>
                                    <button onClick={() => { setEditingGroup(group); setShowGroupForm(false) }} className="mg-btn-icon" style={{ color: '#5F7154' }}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteGroup(group.id)} disabled={deletingGroupId === group.id} className="mg-btn-icon" style={{ color: '#c0392b', opacity: deletingGroupId === group.id ? 0.4 : 1 }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {isExpanded && !isEditingThisGroup && (
                                <div className="mg-mods-container">
                                    {group.modifiers
                                        .slice()
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((mod) => {
                                            const isEditingThisMod = editingModifier?.modifier.id === mod.id && editingModifier?.groupId === group.id
                                            if (isEditingThisMod) {
                                                return <ModifierForm key={mod.id} groupId={group.id} modifier={mod} onDone={handleModifierFormDone} />
                                            }
                                            return (
                                                <div key={mod.id} className="mg-mod-row">
                                                    <span style={{ fontSize: '13px', flex: 1, color: mod.isActive ? '#323232' : '#aaa', textDecoration: mod.isActive ? 'none' : 'line-through', fontWeight: 600, fontFamily: '"Comic Sans MS", cursive' }}>{mod.name}</span>
                                                    {mod.additionalPrice > 0 && (
                                                        <span style={{ fontSize: '12px', color: '#5F7154', fontWeight: 700, fontFamily: '"Comic Sans MS", cursive' }}>+₺{mod.additionalPrice.toFixed(2)}</span>
                                                    )}
                                                    <button onClick={() => setEditingModifier({ groupId: group.id, modifier: mod })} className="mg-btn-icon" style={{ color: '#5F7154' }}>
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => handleDeleteModifier(mod.id)} disabled={deletingModifierId === mod.id} className="mg-btn-icon" style={{ color: '#c0392b', opacity: deletingModifierId === mod.id ? 0.4 : 1 }}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )
                                        })}

                                    {showModifierFormForGroup === group.id ? (
                                        <ModifierForm groupId={group.id} modifier={null} onDone={handleModifierFormDone} />
                                    ) : (
                                        <button onClick={() => { setEditingModifier(null); setShowModifierFormForGroup(group.id) }} className="mg-add-link" style={{ marginTop: '4px' }}>
                                            <Plus className="w-3.5 h-3.5" />
                                            Seçenek Ekle
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
        </div>
    )
}