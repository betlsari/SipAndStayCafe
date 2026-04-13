using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// Simple implementation of <see cref="IStockNotificationService"/> that logs a warning.
///
/// This is the initial implementation.  When the admin panel SignalR hub is ready,
/// inject <c>IHubContext&lt;AdminHub&gt;</c> here and push a real-time notification
/// to the Owner role instead of (or in addition to) the log entry.
/// </summary>
public sealed class LogStockNotificationService : IStockNotificationService
{
    private readonly ILogger<LogStockNotificationService> _logger;

    public LogStockNotificationService(ILogger<LogStockNotificationService> logger)
    {
        _logger = logger;
    }

    public Task NotifyStockNotConfiguredAsync(
        IReadOnlyList<Guid> unconfiguredItemIds,
        CancellationToken cancellationToken = default)
    {
        if (unconfiguredItemIds.Count == 0)
            return Task.CompletedTask;

        _logger.LogWarning(
            "[StockReset] {Count} menu item(s) have no stock configuration for today ({Date}). " +
            "IDs: {Ids}. The owner should update stock availability from the admin panel.",
            unconfiguredItemIds.Count,
            DateOnly.FromDateTime(DateTime.UtcNow),
            string.Join(", ", unconfiguredItemIds));

        return Task.CompletedTask;
    }
}