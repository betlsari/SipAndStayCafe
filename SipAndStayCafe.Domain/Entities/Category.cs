using SipAndStayCafe.Domain.Common;

namespace SipAndStayCafe.Domain.Entities;

/// <summary>
/// A grouping of <see cref="MenuItem"/>s on the menu (e.g. "Bowls", "Hot Drinks", "Desserts").
/// </summary>
/// <remarks>
/// Category is implied by the spec (<c>MenuItem.CategoryId</c>) but not listed as a
/// standalone entity. It is modelled explicitly so the owner can name, reorder, and
/// toggle entire sections of the menu independently of individual items.
/// </remarks>
public sealed class Category : BaseEntity
{
    /// <summary>Display name shown on the customer menu (e.g. "Hot Drinks").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Controls the order in which categories appear on the customer-facing menu.
    /// Lower values appear first.
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// When <c>false</c>, the entire category and all its items are hidden
    /// from the customer menu without deleting them.
    /// </summary>
    public bool IsActive { get; set; } = true;

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>All menu items belonging to this category.</summary>
    public List<MenuItem> MenuItems { get; private set; } = [];
}
