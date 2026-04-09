namespace SipAndStayCafe.Domain.Enums
{
    public enum PaymentMethod
    {
        /// <summary>No payment method has been selected yet. Both paths are still open.</summary>
        None = 0,

        /// <summary>
        /// Customer chose to pay physically at the cashier counter.
        /// The cashier screen shows a "Waiting for Payment" badge for this table.
        /// Online payment is locked for this session.
        /// </summary>
        Cashier = 1,

        /// <summary>
        /// Customer chose to pay online via İyzico.
        /// Cashier payment is locked for this session.
        /// The session closes automatically on a successful İyzico callback.
        /// </summary>
        Online = 2
    }
}
