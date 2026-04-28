namespace SipAndStayCafe.Application.Interfaces;

/// <summary>
/// Ödeme ile ilgili real-time bildirimlerin soyutlaması.
/// Implementation SignalR hub'ları üzerinden Infrastructure katmanında yapılır.
/// </summary>
public interface IPaymentNotificationService
{
    /// <summary>
    /// Müşteri kasiyerden ödeme talep ettiğinde kasiyer ekranına bildirim gönderir.
    /// Cashier payment handler tarafından çağrılır (Görev 8).
    /// </summary>
    Task NotifyTableWaitingForPaymentAsync(
        int tableNumber,
        decimal totalAmount,
        CancellationToken cancellationToken);

    /// <summary>
    /// Masa oturumu kapandığında (online veya cashier) kasiyer ekranını günceller.
    /// İyzico callback ve cashier manuel onay handler tarafından çağrılır (Görev 8).
    /// </summary>
    Task NotifyTableSessionClosedAsync(
        int tableNumber,
        CancellationToken cancellationToken);
    // Mevcut NotifyTableSessionClosedAsync metodunun altına ekle:
}