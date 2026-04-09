namespace SipAndStayCafe.Domain.Enums
{
    public enum ModifierSelectionType
    {
        /// <summary>
        /// The customer must choose exactly one option from the group.
        /// Example: Milk Type (Whole / Oat / Almond).
        /// </summary>
        Single = 0,

        /// <summary>
        /// The customer may choose zero or more options from the group.
        /// Example: Extra Toppings (Avocado, Egg, Feta…).
        /// </summary>
        Multi = 1
    }
}
