using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.ValueObjects;

namespace SipAndStayCafe.Domain.Entities;

public sealed class OrderItem : BaseEntity
{
    /// <summary>FK to the parent <see cref="Order"/>.</summary>
    public Guid OrderId { get; set; }

    /// <summary>
    /// FK to the <see cref="MenuItem"/> that was ordered.
    /// Kept as a live reference so reports can group by item and look up current details.
    /// The customer-facing receipt uses the snapshotted name via <see cref="MenuItemNameSnapshot"/>.
    /// </summary>
    public Guid MenuItemId { get; set; }

    /// <summary>
    /// Snapshot of the menu item's display name at the time the order was placed.
    /// Used for receipts and the cashier view so renames don't affect past orders.
    /// </summary>
    public string MenuItemNameSnapshot { get; set; } = string.Empty;

    /// <summary>How many units of this item were ordered.</summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Modifiers chosen by the customer for this line, stored as a JSON snapshot.
    /// See <see cref="OrderItemModifier"/> for the snapshot rationale.
    /// </summary>
    public List<OrderItemModifier> SelectedModifiers { get; set; } = [];

    /// <summary>
    /// Pre-calculated total for this line:
    /// <c>(MenuItem.BasePrice + sum(modifier.AdditionalPrice)) × Quantity</c>.
    /// Computed by the application service before persisting; never recalculated post-save.
    /// </summary>
    public decimal ItemTotal { get; set; }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The order this item belongs to.</summary>
    public Order Order { get; set; } = null!;

    /// <summary>The menu item that was ordered (live reference for reporting).</summary>
    public MenuItem MenuItem { get; set; } = null!;
}
