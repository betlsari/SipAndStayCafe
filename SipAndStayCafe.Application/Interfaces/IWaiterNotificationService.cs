namespace SipAndStayCafe.Application.Interfaces;

public interface IWaiterNotificationService
{
    Task NotifyWaiterCalledAsync(
        int tableNumber,
        string? note,
        CancellationToken cancellationToken = default);
}