using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SipAndStayCafe.WebAPI.Hubs;

/// <summary>
/// Sipariş akışı için SignalR hub'ı.
///
/// Groups:
///   table-{tableNumber} — müşteri ekranları (anonim)
///   kitchen             — mutfak ekranı (KitchenStaff rolü)
///
/// Client → Server:
///   JoinTableGroup(int tableNumber)  — müşteri bağlandığında çağırır
///   JoinKitchenGroup()               — mutfak ekranı bağlandığında çağırır
///   LeaveTableGroup(int tableNumber) — müşteri ayrılırken çağırır
///
/// Server → Client:
///   ReceiveNewOrder      — mutfak grubuna, yeni sipariş geldi
///   OrderStatusUpdated   — masa grubuna, sipariş durumu değişti
/// </summary>
[AllowAnonymous]
public sealed class OrderHub : Hub
{
    // -----------------------------------------------------------------------
    // Client → Server: Group yönetimi
    // -----------------------------------------------------------------------

    /// <summary>
    /// Müşteri QR okuttuğunda kendi masa grubuna katılır.
    /// Böylece sadece kendi masasına ait durum güncellemelerini alır.
    /// </summary>
    public async Task JoinTableGroup(int tableNumber)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, TableGroupName(tableNumber));
    }

    /// <summary>
    /// Mutfak ekranı bağlandığında kitchen grubuna katılır.
    /// Tüm masalardan gelen yeni siparişleri bu grup üzerinden alır.
    /// </summary>
    public async Task JoinKitchenGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, KitchenGroup);
    }

    /// <summary>
    /// Müşteri sayfadan ayrılırken masa grubundan çıkar.
    /// OnDisconnectedAsync otomatik temizler ama explicit çağrı da desteklenir.
    /// </summary>
    public async Task LeaveTableGroup(int tableNumber)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, TableGroupName(tableNumber));
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /// <summary>
    /// Bağlantı koptuğunda SignalR grup üyeliklerini otomatik temizler.
    /// Manuel RemoveFromGroupAsync gerekmez — override bilgi amaçlı.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // SignalR bağlantı kopunca grup üyeliklerini otomatik kaldırır.
        // Burada ek cleanup gerekmez.
        await base.OnDisconnectedAsync(exception);
    }

    // -----------------------------------------------------------------------
    // Group name helpers — Infrastructure implementasyonu da bunları kullanacak
    // -----------------------------------------------------------------------

    public const string KitchenGroup = "kitchen";

    public static string TableGroupName(int tableNumber)
        => $"table-{tableNumber}";
}