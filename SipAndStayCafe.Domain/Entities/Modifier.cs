using SipAndStayCafe.Domain.Common;

namespace SipAndStayCafe.Domain.Entities;

/// <summary>
/// A single selectable option within a <see cref="ModifierGroup"/>.
/// </summary>
/// <remarks>
/// <para>
/// <b>Pricing:</b> <see cref="AdditionalPrice"/> is the surcharge added to the item's
/// <see cref="MenuItem.BasePrice"/> when this modifier is selected. Zero means no extra charge
/// (e.g. "Whole Milk" as the default milk option might cost nothing extra).
/// </para>
/// <para>
/// <b>Immutability after ordering:</b> When a customer places an order, the modifier's
/// <see cref="Name"/> and <see cref="AdditionalPrice"/> are <em>snapshotted</em> into
/// <see cref="OrderItemModifier"/> on the <see cref="OrderItem"/>. Changing a modifier's
/// price afterwards does not affect historical orders.
/// </para>
/// </remarks>
public sealed class Modifier : BaseEntity
{
    /// <summary>Display name of the option (e.g. "Oat Milk", "Extra Avocado").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Price surcharge applied when this modifier is selected, in the local currency.
    /// Use <c>0</c> for options that carry no additional cost.
    /// </summary>
    public decimal AdditionalPrice { get; set; }

    /// <summary>FK to the <see cref="ModifierGroup"/> this option belongs to.</summary>
    public Guid ModifierGroupId { get; set; }

    /// <summary>Controls display order within the group.</summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// When <c>false</c>, this option is hidden from the customer without being deleted.
    /// Useful for seasonal items or temporarily unavailable extras.
    /// </summary>
    public bool IsActive { get; set; } = true;

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The group this modifier belongs to.</summary>
    public ModifierGroup ModifierGroup { get; set; } = null!;
}
