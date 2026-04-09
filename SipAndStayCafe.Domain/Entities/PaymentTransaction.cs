using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Domain.Entities;

public sealed class PaymentTransaction : BaseEntity
{
    /// <summary>FK to the <see cref="TableSession"/> this transaction belongs to.</summary>
    public Guid TableSessionId { get; set; }

    /// <summary>The external payment gateway used (currently only İyzico).</summary>
    public PaymentProvider Provider { get; set; } = PaymentProvider.Iyzico;

    /// <summary>
    /// The payment ID returned by the provider (e.g. İyzico's <c>paymentId</c>).
    /// Used to match incoming webhook callbacks to the correct transaction record
    /// and to query the provider's dashboard.
    /// <c>null</c> until the provider assigns an ID (i.e. after the redirect is issued).
    /// </summary>
    public string? ProviderPaymentId { get; set; }

    /// <summary>
    /// The amount that was (or was attempted to be) charged, in local currency.
    /// Captured at transaction creation time from <see cref="TableSession.TotalAmount"/>.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>The outcome of this specific transaction attempt.</summary>
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    /// <summary>
    /// UTC timestamp when the provider reported completion (success or failure).
    /// <c>null</c> while the transaction is still <see cref="PaymentStatus.Pending"/>.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Raw error message or failure reason returned by the provider, if any.
    /// Stored for debugging; not shown to the customer.
    /// </summary>
    public string? FailureReason { get; set; }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The session this transaction is associated with.</summary>
    public TableSession TableSession { get; set; } = null!;
}
