import { useState } from 'react'
import { menuApi } from '../../api/menu.api'
import type { MenuItemDto, ModifierGroupDto, ModifierDto } from '../../types/index'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    item: MenuItemDto
    onRefresh: () => void
}

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500'

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

    return (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3 flex flex-col gap-3">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Grup adı (Örn: Süt Seçimi)"
                className={inputCls}
            />
            <div className="grid grid-cols-2 gap-2">
                <select
                    value={selectionType}
                    onChange={(e) => setSelectionType(e.target.value as 'Single' | 'Multi')}
                    className={inputCls}
                >
                    <option value="Single">Tek Seçim</option>
                    <option value="Multi">Çoklu Seçim</option>
                </select>
                <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    placeholder="Sıra"
                    className={inputCls}
                />
            </div>
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="accent-violet-500"
                    />
                    Zorunlu seçim
                </label>
                <div className="flex gap-2">
                    <button onClick={onDone} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Check className="w-3.5 h-3.5" />
                        {saving ? 'Kaydediliyor…' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
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

    return (
        <div className="bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-3 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seçenek adı"
                    className={inputCls}
                />
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={additionalPrice}
                    onChange={(e) => setAdditionalPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Ek fiyat (₺)"
                    className={inputCls}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    placeholder="Sıra"
                    className={inputCls}
                />
                {isEdit && (
                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer px-1">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="accent-violet-500"
                        />
                        Aktif
                    </label>
                )}
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onDone} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                    <X className="w-4 h-4" />
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                >
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

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Modifier Grupları
                </span>
                {!showGroupForm && !editingGroup && (
                    <button
                        onClick={() => { setEditingGroup(null); setShowGroupForm(true) }}
                        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Grup Ekle
                    </button>
                )}
            </div>

            {(showGroupForm && !editingGroup) && (
                <GroupForm itemId={item.id} group={null} onDone={handleGroupFormDone} />
            )}

            {item.modifierGroups.length === 0 && !showGroupForm && (
                <div className="rounded-xl border border-dashed border-zinc-700 py-6 text-center text-zinc-600 text-xs">
                    Henüz modifier grubu yok.
                </div>
            )}

            {item.modifierGroups
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((group) => {
                    const isExpanded = expandedGroupId === group.id
                    const isEditingThisGroup = editingGroup?.id === group.id

                    return (
                        <div key={group.id} className="bg-zinc-800/40 border border-zinc-700/60 rounded-xl overflow-hidden">
                            {/* Group header */}
                            {isEditingThisGroup ? (
                                <div className="p-3">
                                    <GroupForm itemId={item.id} group={group} onDone={handleGroupFormDone} />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2.5">
                                    <button
                                        onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                                        className="flex-1 flex items-center gap-2 text-left"
                                    >
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                                            : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                                        }
                                        <span className="text-sm font-semibold text-zinc-200">{group.name}</span>
                                        <span className="text-xs text-zinc-500">
                                            {group.selectionType === 'Single' ? 'Tek' : 'Çoklu'}
                                            {group.isRequired ? ' · Zorunlu' : ''}
                                        </span>
                                        <span className="ml-auto text-xs text-zinc-600">
                                            {group.modifiers.length} seçenek
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => { setEditingGroup(group); setShowGroupForm(false) }}
                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGroup(group.id)}
                                        disabled={deletingGroupId === group.id}
                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-40"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Modifiers */}
                            {isExpanded && !isEditingThisGroup && (
                                <div className="px-3 pb-3 flex flex-col gap-2 border-t border-zinc-700/60 pt-2">
                                    {group.modifiers
                                        .slice()
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((mod) => {
                                            const isEditingThisMod =
                                                editingModifier?.modifier.id === mod.id &&
                                                editingModifier?.groupId === group.id

                                            if (isEditingThisMod) {
                                                return (
                                                    <ModifierForm
                                                        key={mod.id}
                                                        groupId={group.id}
                                                        modifier={mod}
                                                        onDone={handleModifierFormDone}
                                                    />
                                                )
                                            }

                                            return (
                                                <div
                                                    key={mod.id}
                                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-800/60"
                                                >
                                                    <span className={`text-sm flex-1 ${mod.isActive ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>
                                                        {mod.name}
                                                    </span>
                                                    {mod.additionalPrice > 0 && (
                                                        <span className="text-xs text-emerald-400 font-medium">
                                                            +₺{mod.additionalPrice.toFixed(2)}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => setEditingModifier({ groupId: group.id, modifier: mod })}
                                                        className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteModifier(mod.id)}
                                                        disabled={deletingModifierId === mod.id}
                                                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-40"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )
                                        })}

                                    {showModifierFormForGroup === group.id ? (
                                        <ModifierForm
                                            groupId={group.id}
                                            modifier={null}
                                            onDone={handleModifierFormDone}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingModifier(null)
                                                setShowModifierFormForGroup(group.id)
                                            }}
                                            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors mt-1"
                                        >
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