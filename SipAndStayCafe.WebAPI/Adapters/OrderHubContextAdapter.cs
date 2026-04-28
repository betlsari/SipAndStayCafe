using Microsoft.AspNetCore.SignalR;
using SipAndStayCafe.Application.Interfaces.Hubs;
using SipAndStayCafe.WebAPI.Hubs;

namespace SipAndStayCafe.WebAPI.Adapters;

/// <summary>
/// <see cref="IOrderHubContext"/>'in WebAPI katmanındaki gerçek implementasyonu.
///
/// Bu sınıf, Infrastructure'ın SignalR'a doğrudan bağımlı olmadan mesaj
/// gönderebildiği köprü noktasıdır. Infrastructure yalnızca Application
/// katmanındaki <see cref="IOrderHubContext"/> interface'ini bilir; bu
/// adapter WebAPI DI kayıdında inject edilir.
///
/// Bağımlılık akışı:
///   Infrastructure → IOrderHubContext (Application)
///                         ↑ implement
///                   OrderHubContextAdapter (WebAPI)
///                         → IHubContext&lt;OrderHub&gt; (SignalR)
/// </summary>
public sealed class OrderHubContextAdapter : IOrderHubContext
{
    private readonly IHubContext<OrderHub> _hubContext;

    public OrderHubContextAdapter(IHubContext<OrderHub> hubContext)
    {
        _hubContext = hubContext;
    }

    /// <inheritdoc/>
    public async Task SendToGroupAsync(
        string groupName,
        string method,
        object arg1,
        CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group(groupName)
            .SendAsync(method, arg1, cancellationToken);
    }
}