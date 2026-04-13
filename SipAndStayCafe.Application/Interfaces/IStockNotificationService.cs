namespace SipAndStayCafe.Application.Interfaces;

/// <summary>
/// Abstraction for sending stock-related notifications.
/// Implemented in Infrastructure; called from Hangfire background jobs.
///
/// Keeping this interface in the Application layer maintains the Clean Architecture
/// rule: Infrastructure jobs depend on Application abstractions, not the other way around.
/// </summary>
public interface IStockNotificationService
{
    /// <summary>
    /// Sends a reminder to the Owner that today's stock has not been configured yet.
    /// Currently implemented as a log warning; can be extended to push a SignalR
    /// notification to the admin panel or send an email.
    /// </summary>
    /// <param name="unconfiguredItemIds">
    /// Menu item IDs that have no StockUpdate record for today.
    /// The owner should review and mark items as in/out of stock.
    /// </param>
    Task NotifyStockNotConfiguredAsync(
        IReadOnlyList<Guid> unconfiguredItemIds,
        CancellationToken cancellationToken = default);
}