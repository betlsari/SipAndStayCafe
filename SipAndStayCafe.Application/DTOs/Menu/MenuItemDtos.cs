namespace SipAndStayCafe.Application.DTOs.Menu;

// ────────────────────────────────────────────────────────────────────────────
// MenuItem DTOs
// ────────────────────────────────────────────────────────────────────────────

/// <summary>Full detail — used in admin panel and customer menu detail view.</summary>
public sealed record MenuItemDto(
    Guid Id,
    string Name,
    string? Description,
    decimal BasePrice,
    Guid CategoryId,
    string CategoryName,
    bool IsAvailable,
    string? ImageUrl,
    int DisplayOrder,
    IReadOnlyList<ModifierGroupDto> ModifierGroups);

/// <summary>Lightweight summary — used in list views and cashier screen.</summary>
public sealed record MenuItemSummaryDto(
    Guid Id,
    string Name,
    decimal BasePrice,
    Guid CategoryId,
    bool IsAvailable,
    string? ImageUrl,
    int DisplayOrder);

/// <summary>
/// Full category with its items — returned from the public menu endpoint.
/// Only active categories with available items are included.
/// </summary>
public sealed record MenuCategoryDto(
    Guid Id,
    string Name,
    int DisplayOrder,
    IReadOnlyList<MenuItemDto> Items);

public sealed record CreateMenuItemRequest(
    string Name,
    string? Description,
    decimal BasePrice,
    Guid CategoryId,
    string? ImageUrl,
    int DisplayOrder);

public sealed record UpdateMenuItemRequest(
    string Name,
    string? Description,
    decimal BasePrice,
    Guid CategoryId,
    bool IsAvailable,
    string? ImageUrl,
    int DisplayOrder);

public sealed record UpdateStockRequest(
    bool IsAvailable,
    string? Note);