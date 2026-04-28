using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Services;

public sealed class LogWaiterNotificationService : IWaiterNotificationService
{
    private readonly ILogger<LogWaiterNotificationService> _logger;

    public LogWaiterNotificationService(ILogger<LogWaiterNotificationService> logger)
    {
        _logger = logger;
    }

    public Task NotifyWaiterCalledAsync(
        int tableNumber, string? note, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[WaiterCall] Table {TableNumber} is calling a waiter. Note: {Note}",
            tableNumber, note ?? "-");
        return Task.CompletedTask;
    }
}