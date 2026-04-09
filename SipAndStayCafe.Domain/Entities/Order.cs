using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Domain.Entities;

public sealed class Order : BaseEntity
{
    /// <summary>FK to the <see cref="TableSession"/> this order belongs to.</summary>
    public Guid TableSessionId { get; set; }

    /// <summary>
    /// The current kitchen status of this order.
    /// Defaults to <see cref="OrderStatus.Received"/> when created.
    /// </summary>
    public OrderStatus Status { get; set; } = OrderStatus.Received;

    /// <summary>
    /// Optional customer-facing note for the kitchen
    /// (e.g. "no onions", "extra spicy").
    /// </summary>
    public string? Note { get; set; }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The session this order belongs to.</summary>
    public TableSession TableSession { get; set; } = null!;

    /// <summary>The individual line items in this order.</summary>
    public List<OrderItem> OrderItems { get; private set; } = [];

    // -----------------------------------------------------------------------
    // Computed helpers (not mapped — use for in-memory calculation only)
    // -----------------------------------------------------------------------

    /// <summary>
    /// Sum of all <see cref="OrderItem.ItemTotal"/> values in this order.
    /// Not stored in the database — computed on demand.
    /// </summary>
    public decimal OrderTotal => OrderItems.Sum(i => i.ItemTotal);
}
