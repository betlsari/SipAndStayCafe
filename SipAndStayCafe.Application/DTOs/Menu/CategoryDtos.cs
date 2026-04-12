namespace SipAndStayCafe.Application.DTOs.Menu;

// ────────────────────────────────────────────────────────────────────────────
// Category DTOs
// ────────────────────────────────────────────────────────────────────────────

public sealed record CategoryDto(
    Guid Id,
    string Name,
    int DisplayOrder,
    bool IsActive);

public sealed record CreateCategoryRequest(
    string Name,
    int DisplayOrder);

public sealed record UpdateCategoryRequest(
    string Name,
    int DisplayOrder,
    bool IsActive);