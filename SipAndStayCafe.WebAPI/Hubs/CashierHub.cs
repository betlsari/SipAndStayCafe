using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SipAndStayCafe.WebAPI.Hubs;

/// <summary>
/// Kasiyer ekranı için SignalR hub'ı.
///
/// Groups:
///   cashier — tüm kasiyer ve owner ekranları
///
/// Bağlanan her yetkili kullanıcı OnConnectedAsync ile otomatik olarak
/// cashier grubuna eklenir. Frontend'in ayrıca JoinCashierGroup çağırmasına
/// gerek yoktur.
///
/// Server → Client:
///   TableWaitingForPayment — masa ödeme bekliyor
///   TableSessionClosed     — masa oturumu kapandı
/// </summary>
[Authorize(Roles = "Cashier,Owner")]
public sealed class CashierHub : Hub
{
    // -----------------------------------------------------------------------
    // Lifecycle — group yönetimi burada, business logic yok
    // -----------------------------------------------------------------------

    /// <summary>
    /// Yetkili kullanıcı bağlandığında otomatik olarak cashier grubuna eklenir.
    /// Frontend'in ayrıca bir Join çağrısı yapmasına gerek kalmaz.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, CashierGroup);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // SignalR bağlantı kopunca grup üyeliklerini otomatik temizler.
        await base.OnDisconnectedAsync(exception);
    }

    // -----------------------------------------------------------------------
    // Group name helpers
    // -----------------------------------------------------------------------

    /// <summary>Tüm kasiyer ve owner ekranlarının dahil olduğu sabit grup adı.</summary>
    public const string CashierGroup = "cashier";

    // -----------------------------------------------------------------------
    // Server → Client method names
    // -----------------------------------------------------------------------

    /// <summary>
    /// Müşteri kasiyerden ödeme talep ettiğinde cashier grubuna gönderilir.
    /// <br/>Payload: <c>int tableNumber, decimal totalAmount</c>
    /// </summary>
    public const string TableWaitingForPayment = nameof(TableWaitingForPayment);

    /// <summary>
    /// Masa oturumu kapandığında cashier grubuna gönderilir.
    /// <br/>Payload: <c>int tableNumber</c>
    /// </summary>
    public const string TableSessionClosed = nameof(TableSessionClosed);
}