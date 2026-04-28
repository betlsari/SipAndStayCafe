using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.DTOs.Order;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Application.Interfaces.Hubs;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// <see cref="IOrderNotificationService"/>'in SignalR implementasyonu.
///
/// Bağımlılıklar:
///   - <see cref="IOrderHubContext"/>  : Application katmanında tanımlı soyut hub proxy.
///     Gerçek implementasyon (OrderHubContextAdapter) WebAPI katmanında tanımlanır ve
///     DI üzerinden buraya inject edilir. Infrastructure, OrderHub tipini hiç bilmez.
///
/// Grup isimleri:
///   - "kitchen"      : Mutfak ekranı — yeni sipariş event'leri buraya gider.
///   - "table-{no}"   : İlgili müşteri ekranı — durum güncellemeleri buraya gider.
///
/// Method isimleri OrderHub'daki sabitlerle senkronize olmalıdır.
/// Bu string'leri doğrudan burada tekrar etmek yerine bir sabit sınıfına taşımayı
/// düşünebilirsin (post-MVP).
/// </summary>
public sealed class SignalROrderNotificationService : IOrderNotificationService
{
    private readonly IOrderHubContext _hubContext;
    private readonly ILogger<SignalROrderNotificationService> _logger;

    // SignalR client method isimleri — OrderHub.cs'deki sabitlerle eşleşmeli.
    // Infrastructure OrderHub'a bağımlı olmadığı için string olarak tutuyoruz.
    private const string ReceiveNewOrder = "ReceiveNewOrder";
    private const string OrderStatusUpdated = "OrderStatusUpdated";

    public SignalROrderNotificationService(
        IOrderHubContext hubContext,
        ILogger<SignalROrderNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc/>
    /// <remarks>
    /// Yeni sipariş verildiğinde "kitchen" grubuna <c>ReceiveNewOrder</c> event'i gönderilir.
    /// Payload: <see cref="OrderDto"/> + tableNumber.
    /// </remarks>
    public async Task NotifyNewOrderAsync(
        OrderDto order,
        int tableNumber,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "[SignalR] Yeni sipariş bildirimi → kitchen grubu. OrderId: {OrderId}, Table: {TableNumber}",
            order.Id, tableNumber);

        var payload = new { Order = order, TableNumber = tableNumber };

        await _hubContext.SendToGroupAsync(
            groupName: "kitchen",
            method: ReceiveNewOrder,
            arg1: payload,
            cancellationToken: cancellationToken);
    }

    /// <inheritdoc/>
    /// <remarks>
    /// Sipariş durumu değiştiğinde ilgili masa grubuna <c>OrderStatusUpdated</c> event'i gönderilir.
    /// Payload: orderId + yeni durum string'i.
    /// </remarks>
    public async Task NotifyOrderStatusChangedAsync(
        Guid orderId,
        int tableNumber,
        OrderStatus newStatus,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "[SignalR] Sipariş durum bildirimi → table-{TableNumber} grubu. OrderId: {OrderId}, Status: {Status}",
            tableNumber, orderId, newStatus);

        var payload = new
        {
            OrderId = orderId,
            NewStatus = newStatus.ToString()
        };

        await _hubContext.SendToGroupAsync(
            groupName: $"table-{tableNumber}",
            method: OrderStatusUpdated,
            arg1: payload,
            cancellationToken: cancellationToken);
    }
}