using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SipAndStayCafe.WebAPI.Hubs;

[AllowAnonymous]
public sealed class OrderHub : Hub
{
    // -----------------------------------------------------------------------
    // Client → Server: Group yönetimi
    // -----------------------------------------------------------------------

    /// <summary>
    /// Müşteri QR okuttuğunda kendi masa grubuna katılır.
    /// Anonymous — tüm bağlantılar çağırabilir.
    /// </summary>
    public async Task JoinTableGroup(int tableNumber)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, TableGroupName(tableNumber));
    }

    /// <summary>
    /// Mutfak ekranı kitchen grubuna katılır.
    /// Sadece KitchenStaff rolündeki kullanıcılar kabul edilir.
    /// Hub [AllowAnonymous] olduğu için rol kontrolü burada yapılır.
    /// </summary>
    public async Task JoinKitchenGroup()
    {
        if (!Context.User?.IsInRole("KitchenStaff") ?? true)
        {
            throw new HubException("Bu işlem için KitchenStaff rolü gereklidir.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, KitchenGroup);
    }

    /// <summary>
    /// Müşteri sayfadan ayrılırken masa grubundan çıkar.
    /// OnDisconnectedAsync zaten temizler; explicit çağrı da desteklenir.
    /// </summary>
    public async Task LeaveTableGroup(int tableNumber)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, TableGroupName(tableNumber));
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

    public const string KitchenGroup = "kitchen";

    public static string TableGroupName(int tableNumber) => $"table-{tableNumber}";

    // -----------------------------------------------------------------------
    // Server → Client method names
    // -----------------------------------------------------------------------

    public const string ReceiveNewOrder = nameof(ReceiveNewOrder);
    public const string OrderStatusUpdated = nameof(OrderStatusUpdated);
}