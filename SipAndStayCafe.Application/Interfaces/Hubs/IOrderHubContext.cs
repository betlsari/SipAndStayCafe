namespace SipAndStayCafe.Application.Interfaces.Hubs;

/// <summary>
/// OrderHub üzerinden mesaj göndermek için Application katmanının kullandığı soyut proxy.
///
/// Infrastructure bu interface'e bağımlıdır — doğrudan OrderHub tipine değil.
/// WebAPI katmanındaki OrderHubContextAdapter bu interface'i IHubContext&lt;OrderHub&gt;
/// üzerinden implement eder ve DI'a kaydeder.
///
/// Böylece Infrastructure → WebAPI bağımlılığı tamamen ortadan kalkar.
/// </summary>
public interface IOrderHubContext
{
    /// <summary>
    /// Belirtilen SignalR grubuna (örn. "kitchen", "table-3") bir event gönderir.
    /// </summary>
    /// <param name="groupName">Hedef grup adı.</param>
    /// <param name="method">Client tarafında çağrılacak method adı.</param>
    /// <param name="arg1">Gönderilecek payload.</param>
    /// <param name="cancellationToken">İptal token'ı.</param>
    Task SendToGroupAsync(
        string groupName,
        string method,
        object arg1,
        CancellationToken cancellationToken = default);
}