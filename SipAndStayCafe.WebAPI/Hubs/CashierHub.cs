using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SipAndStayCafe.WebAPI.Hubs;

/// <summary>
/// Kasiyer ekranı için SignalR hub'ı.
///
/// Groups:
///   cashier — tüm kasiyer ve owner ekranları
///
/// Client → Server:
///   JoinCashierGroup() — kasiyer ekranı bağlandığında çağırır
///
/// Server → Client:
///   TableWaitingForPayment — masa ödeme bekliyor (Görev 8)
///   TableSessionClosed     — masa oturumu kapandı (Görev 8)
/// </summary>
[Authorize(Roles = "Cashier,Owner")]
public sealed class CashierHub : Hub
{
    // -----------------------------------------------------------------------
    // Client → Server: Group yönetimi
    // -----------------------------------------------------------------------

    /// <summary>
    /// Kasiyer ekranı bağlandığında cashier grubuna katılır.
    /// Tüm masalara ait ödeme bildirimlerini bu grup üzerinden alır.
    /// </summary>
    public async Task JoinCashierGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, CashierGroup);
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    // -----------------------------------------------------------------------
    // Group name helpers
    // -----------------------------------------------------------------------

    public const string CashierGroup = "cashier";
}