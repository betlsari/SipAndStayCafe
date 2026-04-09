using SipAndStayCafe.Domain.Common;

namespace SipAndStayCafe.Domain.Entities;

public sealed class StockUpdate : BaseEntity
{
    /// <summary>FK to the <see cref="MenuItem"/> whose availability is being recorded.</summary>
    public Guid MenuItemId { get; set; }

    /// <summary>
    /// The calendar date (UTC) this update applies to.
    /// Stored as <c>Date</c> only — time component is always midnight UTC.
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// <c>true</c> = item is available for ordering on this date.
    /// <c>false</c> = item is out of stock and hidden from the customer menu.
    /// </summary>
    public bool IsAvailable { get; set; }

    /// <summary>
    /// Optional note from the owner explaining the stock decision
    /// (e.g. "delivery delayed", "seasonal item").
    /// </summary>
    public string? Note { get; set; }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The menu item this update applies to.</summary>
    public MenuItem MenuItem { get; set; } = null!;
}