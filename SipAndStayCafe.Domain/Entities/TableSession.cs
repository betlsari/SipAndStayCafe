using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Domain.Entities;

public sealed class TableSession : BaseEntity
{
    /// <summary>FK to the <see cref="Table"/> this session belongs to.</summary>
    public Guid TableId { get; set; }

    /// <summary>UTC timestamp when the session was opened (first order placed).</summary>
    public DateTime OpenedAt { get; set; }

    /// <summary>
    /// UTC timestamp when the session was closed (payment confirmed).
    /// <c>null</c> means the session is still active.
    /// </summary>
    public DateTime? ClosedAt { get; private set; }

    /// <summary>
    /// <c>true</c> once payment has been fully confirmed and the session is closed.
    /// </summary>
    public bool IsPaid { get; private set; }

    /// <summary>
    /// Running total of all orders in this session.
    /// Updated by the application service whenever a new order round is appended.
    /// Also set as the final amount when the session closes.
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// The payment path chosen by the customer.
    /// Defaults to <see cref="Enums.PaymentMethod.None"/> until the customer initiates checkout.
    /// Locked once set to a non-<c>None</c> value — see <see cref="InitiateCashierPayment"/>
    /// and <see cref="InitiateOnlinePayment"/>.
    /// </summary>
    public PaymentMethod PaymentMethod { get; private set; } = PaymentMethod.None;

    /// <summary>
    /// The current payment outcome for this session.
    /// <see cref="Enums.PaymentStatus.Pending"/> while awaiting confirmation,
    /// <see cref="Enums.PaymentStatus.Completed"/> once paid.
    /// </summary>
    public PaymentStatus PaymentStatus { get; private set; } = PaymentStatus.None;

    /// <summary>
    /// UTC timestamp when a payment path was first initiated (either method).
    /// Used for timeout logic and audit purposes.
    /// </summary>
    public DateTime? PaymentLockedAt { get; private set; }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /// <summary>The physical table this session is associated with.</summary>
    public Table Table { get; set; } = null!;

    /// <summary>All order rounds placed during this session.</summary>
    public List<Order> Orders { get; private set; } = [];

    /// <summary>
    /// All online payment attempts for this session, including failures.
    /// Empty for cashier-paid sessions.
    /// </summary>
    public List<PaymentTransaction> PaymentTransactions { get; private set; } = [];

    // -----------------------------------------------------------------------
    // Domain behaviour — payment locking invariants
    // -----------------------------------------------------------------------

    /// <summary>
    /// Initiates the cashier payment path.
    /// </summary>
    /// <returns>
    /// <c>true</c> if the lock was successfully applied;
    /// <c>false</c> if a payment method was already locked for this session.
    /// </returns>
    /// <remarks>
    /// Callers MUST check the return value. A <c>false</c> result means the
    /// application service should return a conflict error to the caller —
    /// do not silently proceed.
    /// </remarks>
    public bool InitiateCashierPayment()
    {
        if (PaymentMethod != PaymentMethod.None)
            return false;

        PaymentMethod = PaymentMethod.Cashier;
        PaymentStatus = PaymentStatus.Pending;
        PaymentLockedAt = DateTime.UtcNow;
        return true;
    }

    /// <summary>
    /// Initiates the online (İyzico) payment path.
    /// </summary>
    /// <inheritdoc cref="InitiateCashierPayment"/>
    public bool InitiateOnlinePayment()
    {
        if (PaymentMethod != PaymentMethod.None)
            return false;

        PaymentMethod = PaymentMethod.Online;
        PaymentStatus = PaymentStatus.Pending;
        PaymentLockedAt = DateTime.UtcNow;
        return true;
    }

    /// <summary>
    /// Closes the session after successful payment confirmation
    /// (cashier confirmation click or İyzico success callback).
    /// </summary>
    /// <remarks>
    /// Idempotent: calling <see cref="Close"/> on an already-closed session is a no-op.
    /// This is intentional — İyzico may deliver the success webhook more than once;
    /// the second delivery must not throw or re-process.
    /// </remarks>
    public void Close()
    {
        if (IsPaid)
            return; // already closed — idempotent, safe for duplicate webhook delivery

        IsPaid = true;
        PaymentStatus = PaymentStatus.Completed;
        ClosedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Marks the current online payment attempt as failed.
    /// Resets <see cref="PaymentMethod"/> to <see cref="Enums.PaymentMethod.None"/>
    /// so the customer may retry or switch to cashier payment.
    /// </summary>
    public void MarkOnlinePaymentFailed()
    {
        PaymentStatus = PaymentStatus.Failed;
        PaymentMethod = PaymentMethod.None;   // unlock — allow retry
        PaymentLockedAt = null;
    }
    /// <summary>
    /// Müşteri ödeme yöntemini değiştirmek istediğinde kilidi sıfırlar.
    /// Sadece ödeme henüz tamamlanmamışsa çalışır.
    /// </summary>
    public bool ResetPaymentLock()
    {
        if (IsPaid || ClosedAt.HasValue) return false;
        PaymentMethod = PaymentMethod.None;
        PaymentStatus = PaymentStatus.None;
        PaymentLockedAt = null;
        return true;
    }
}
