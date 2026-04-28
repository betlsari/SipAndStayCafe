using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Application.Interfaces.Hubs;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// <see cref="IWaiterNotificationService"/>'in SignalR implementasyonu.
///
/// Müşteri "Garson Çağır" butonuna bastığında kasiyer/personel ekranına
/// real-time bildirim gönderir. Cashier Hub'ı kullanılır çünkü kasiyerler
/// ve ownerlar garson çağrılarını da buradan takip eder.
///
/// Post-MVP: Ayrı bir StaffHub veya KitchenHub'a taşınabilir.
/// </summary>
public sealed class SignalRWaiterNotificationService : IWaiterNotificationService
{
    private readonly ICashierHubContext _hubContext;
    private readonly ILogger<SignalRWaiterNotificationService> _logger;

    // Client method adı — frontend bu isimle dinler.
    private const string WaiterCalled = "WaiterCalled";
    private const string CashierGroup = "cashier";

    public SignalRWaiterNotificationService(
        ICashierHubContext hubContext,
        ILogger<SignalRWaiterNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task NotifyWaiterCalledAsync(
        int tableNumber,
        string? note,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[SignalR] Garson çağrısı → cashier grubu. Table: {TableNumber}, Note: {Note}",
            tableNumber, note ?? "-");

        var payload = new { TableNumber = tableNumber, Note = note };

        await _hubContext.SendToGroupAsync(
            groupName: CashierGroup,
            method: WaiterCalled,
            arg1: payload,
            cancellationToken: cancellationToken);
    }
}