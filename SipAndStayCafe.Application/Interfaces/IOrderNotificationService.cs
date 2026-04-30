using SipAndStayCafe.Application.DTOs.Order;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Application.Interfaces;


public interface IOrderNotificationService
{
    /// <summary>
    /// Yeni sipariş verildiğinde mutfak ekranına bildirim gönderir.
    /// PlaceOrderHandler tarafından çağrılır.
    /// </summary>
    Task NotifyNewOrderAsync(
        OrderDto order,
        int tableNumber,
        CancellationToken cancellationToken);

    /// <summary>
    /// Sipariş durumu değiştiğinde müşteri ekranına bildirim gönderir.
    /// UpdateOrderStatusHandler tarafından çağrılır.
    /// </summary>
    Task NotifyOrderStatusChangedAsync(
        Guid orderId,
        int tableNumber,
        OrderStatus newStatus,
        CancellationToken cancellationToken);
}