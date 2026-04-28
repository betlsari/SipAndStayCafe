namespace SipAndStayCafe.Application.Interfaces.Hubs;

/// <summary>
/// CashierHub üzerinden mesaj göndermek için Application katmanının kullandığı soyut proxy.
///
/// <inheritdoc cref="IOrderHubContext"/>
/// </summary>
public interface ICashierHubContext
{
    /// <summary>
    /// Belirtilen SignalR grubuna bir event gönderir.
    /// </summary>
    Task SendToGroupAsync(
        string groupName,
        string method,
        object arg1,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Birden fazla argüman gerektiren event'ler için overload.
    /// Örn: TableWaitingForPayment(tableNumber, totalAmount)
    /// </summary>
    Task SendToGroupAsync(
        string groupName,
        string method,
        object arg1,
        object arg2,
        CancellationToken cancellationToken = default);
}