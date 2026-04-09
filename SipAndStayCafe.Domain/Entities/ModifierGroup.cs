using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Domain.Entities;

/// <summary>
/// A named group of <see cref="Modifier"/> options attached to a <see cref="MenuItem"/>.
/// </summary>
/// <remarks>
/// Examples:
/// <list type="bullet">
///   <item><description>"Milk Type" on a coffee — <see cref="ModifierSelectionType.Single"/> (customer picks one).</description></item>
///   <item><description>"Extra Toppings" on a bowl — <see cref="ModifierSelectionType.Multi"/> (customer picks zero or more).</description></item>
///   <item><description>"Syrup" on a latte — <see cref="ModifierSelectionType.Multi"/>.</description></item>
/// </list>
/// The <see cref="IsRequired"/> flag drives frontend validation: a required single-select
/// group forces the customer to make a choice before they can add the item to the cart.
/// </remarks>
public sealed class ModifierGroup : BaseEntity
{
    /// <summary>Display name of the group shown on the customer menu (e.g. "Milk Type").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>FK to the <see cref="MenuItem"/> this group belongs to.</summary>
    public Guid MenuItemId { get; set; }

    /// <summary>
    /// Controls whether the customer may select one or multiple modifiers from this group.
    /// </summary>
    public ModifierSelectionType SelectionType { get; set; }

    /// <summary>
    /// When <c>true</c>, the customer must select at least one modifier from this group
    /// before the item can be added to the cart.
    /// Typically <c>true</c> for <see cref="ModifierSelectionType.Single"/> groups
    /// (e.g. milk type is always required).
    /// </summary>
    public bool IsRequired { get; set; }

    /// <summary>Controls display order of groups within the item's customization panel.</summary>
    public int DisplayOrder { get; set; }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The menu item this group is attached to.</summary>
    public MenuItem MenuItem { get; set; } = null!;

    /// <summary>The individual options within this group (e.g. Oat Milk, Almond Milk).</summary>
    public List<Modifier> Modifiers { get; private set; } = [];
}
