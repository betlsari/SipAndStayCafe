using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Application.DTOs.Menu;

// ────────────────────────────────────────────────────────────────────────────
// Modifier DTOs
// ────────────────────────────────────────────────────────────────────────────

public sealed record ModifierDto(
    Guid Id,
    string Name,
    decimal AdditionalPrice,
    int DisplayOrder,
    bool IsActive);

public sealed record ModifierGroupDto(
    Guid Id,
    string Name,
    ModifierSelectionType SelectionType,
    bool IsRequired,
    int DisplayOrder,
    IReadOnlyList<ModifierDto> Modifiers);

public sealed record CreateModifierGroupRequest(
    Guid MenuItemId,
    string Name,
    ModifierSelectionType SelectionType,
    bool IsRequired,
    int DisplayOrder);

public sealed record UpdateModifierGroupRequest(
    string Name,
    ModifierSelectionType SelectionType,
    bool IsRequired,
    int DisplayOrder);

public sealed record CreateModifierRequest(
    Guid ModifierGroupId,
    string Name,
    decimal AdditionalPrice,
    int DisplayOrder);

public sealed record UpdateModifierRequest(
    string Name,
    decimal AdditionalPrice,
    int DisplayOrder,
    bool IsActive);