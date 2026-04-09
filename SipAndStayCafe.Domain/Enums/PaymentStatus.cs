namespace SipAndStayCafe.Domain.Enums
{
    public enum PaymentStatus
    {
        /// <summary>No payment has been initiated yet.</summary>
        None = 0,

        /// <summary>
        /// Payment has been initiated (İyzico redirect issued, or cashier notified)
        /// but not yet confirmed.
        /// </summary>
        Pending = 1,

        /// <summary>Payment was successfully completed. The table session is closed.</summary>
        Completed = 2,

        /// <summary>
        /// Payment failed (İyzico returned a failure, or the transaction was abandoned).
        /// The session remains open; the customer may retry.
        /// </summary>
        Failed = 3
    }
}
