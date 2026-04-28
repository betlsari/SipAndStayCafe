using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Application.Interfaces.Hubs;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// <see cref="IPaymentNotificationService"/>'in SignalR implementasyonu.
///
/// Kasiyer ekranına ödeme ile ilgili real-time event'leri iletir.
/// Tüm mesajlar "cashier" grubuna gönderilir — CashierHub'a bağlanan
/// tüm Cashier ve Owner ekranları bu grupta yer alır.
///
/// Method isimleri CashierHub.cs'deki sabitlerle eşleşmelidir.
/// </summary>
public sealed class SignalRPaymentNotificationService : IPaymentNotificationService
{
    private readonly ICashierHubContext _hubContext;
    private readonly ILogger<SignalRPaymentNotificationService> _logger;

    // CashierHub.cs'deki sabitlerle eşleşmeli.
    private const string TableWaitingForPayment = "TableWaitingForPayment";
    private const string TableSessionClosed = "TableSessionClosed";
    private const string CashierGroup = "cashier";

    public SignalRPaymentNotificationService(
        ICashierHubContext hubContext,
        ILogger<SignalRPaymentNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc/>
    /// <remarks>
    /// Müşteri "Kasiyerde Öde" seçtiğinde kasiyere bildirim gönderilir.
    /// Payload: tableNumber + totalAmount.
    /// </remarks>
    public async Task NotifyTableWaitingForPaymentAsync(
        int tableNumber,
        decimal totalAmount,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "[SignalR] Ödeme bekleniyor bildirimi → cashier grubu. Table: {TableNumber}, Total: {Total}",
            tableNumber, totalAmount);

        await _hubContext.SendToGroupAsync(
            groupName: CashierGroup,
            method: TableWaitingForPayment,
            arg1: tableNumber,
            arg2: totalAmount,
            cancellationToken: cancellationToken);
    }

    /// <inheritdoc/>
    /// <remarks>
    /// Online ödeme başarılı olduğunda veya kasiyer manuel onayladığında
    /// kasiyer ekranından masa kaldırılır.
    /// Payload: tableNumber.
    /// </remarks>
    public async Task NotifyTableSessionClosedAsync(
        int tableNumber,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "[SignalR] Masa oturumu kapandı bildirimi → cashier grubu. Table: {TableNumber}",
            tableNumber);

        await _hubContext.SendToGroupAsync(
            groupName: CashierGroup,
            method: TableSessionClosed,
            arg1: tableNumber,
            cancellationToken: cancellationToken);
    }
}