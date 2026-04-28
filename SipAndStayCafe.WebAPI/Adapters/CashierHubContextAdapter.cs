using Microsoft.AspNetCore.SignalR;
using SipAndStayCafe.Application.Interfaces.Hubs;
using SipAndStayCafe.WebAPI.Hubs;

namespace SipAndStayCafe.WebAPI.Adapters;

/// <summary>
/// <see cref="ICashierHubContext"/>'in WebAPI katmanındaki gerçek implementasyonu.
///
/// <inheritdoc cref="OrderHubContextAdapter"/>
/// </summary>
public sealed class CashierHubContextAdapter : ICashierHubContext
{
    private readonly IHubContext<CashierHub> _hubContext;

    public CashierHubContextAdapter(IHubContext<CashierHub> hubContext)
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

    /// <inheritdoc/>
    public async Task SendToGroupAsync(
        string groupName,
        string method,
        object arg1,
        object arg2,
        CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients
            .Group(groupName)
            .SendAsync(method, arg1, arg2, cancellationToken);
    }
}