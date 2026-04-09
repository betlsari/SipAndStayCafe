using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Domain.ValueObjects
{
    /// <summary>
    /// An immutable snapshot of a <see cref="Entities.Modifier"/> at the moment an order is placed.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This is a value object (no identity of its own) stored as a JSON column inside
    /// the <see cref="Entities.OrderItem"/> row in PostgreSQL.
    /// </para>
    /// <para>
    /// <b>Why a snapshot?</b> The owner may later rename a modifier or change its price.
    /// Using a direct FK to <see cref="Entities.Modifier"/> would cause historical order lines
    /// to silently reflect the updated price/name — breaking receipts, audit trails, and
    /// the cashier's displayed total. The snapshot captures <em>what the customer actually
    /// paid for</em> at the time they ordered.
    /// </para>
    /// </remarks>
    public sealed class OrderItemModifier
    {
        /// <summary>
        /// The <see cref="Entities.Modifier.Id"/> at the time of ordering.
        /// Kept for reference and report queries but not used as a live FK.
        /// </summary>
        public Guid ModifierId { get; init; }

        /// <summary>Modifier name as it appeared on the menu at order time.</summary>
        public string Name { get; init; } = string.Empty;

        /// <summary>Additional price charged for this modifier at order time.</summary>
        public decimal AdditionalPrice { get; init; }
    }
}
