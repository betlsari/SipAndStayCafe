using SipAndStayCafe.Domain.Common;

namespace SipAndStayCafe.Domain.Entities;

public sealed class MenuItem : BaseEntity
{
    /// <summary>Display name of the item (e.g. "Açaí Bowl").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description shown below the name on the customer menu.</summary>
    public string? Description { get; set; }

    /// <summary>
    /// Base price of the item before any modifier surcharges, in the local currency.
    /// Stored as <c>decimal</c> to avoid floating-point rounding errors on money values.
    /// </summary>
    public decimal BasePrice { get; set; }

    /// <summary>FK to the <see cref="Category"/> this item belongs to.</summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Whether the item is currently available to order.
    /// When <c>false</c>, the item is hidden/disabled on the customer menu.
    /// Updated by the owner and by the nightly Hangfire stock-reset job.
    /// </summary>
    public bool IsAvailable { get; set; } = true;

    /// <summary>
    /// URL of the item's photo, stored externally (e.g. cloud storage).
    /// <c>null</c> means no image has been uploaded; the frontend shows a placeholder.
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Controls the display order within the category on the customer menu.
    /// Lower values appear first.
    /// </summary>
    public int DisplayOrder { get; set; }
    public uint RowVersion { get; set; }
    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The category this item belongs to.</summary>
    public Category Category { get; set; } = null!;

    /// <summary>
    /// All modifier groups attached to this item (e.g. "Milk Type", "Extra Toppings").
    /// An item with no modifier groups is ordered as-is with no customization.
    /// </summary>
    public List<ModifierGroup> ModifierGroups { get; private set; } = [];

    /// <summary>Daily availability log entries for this item.</summary>
    public List<StockUpdate> StockUpdates { get; private set; } = [];

    // Optimistic concurrency — EF Core bunu otomatik kontrol eder
    
}
