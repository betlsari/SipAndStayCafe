using SipAndStayCafe.Application.DTOs.Report;

namespace SipAndStayCafe.Application.Interfaces;

public interface IReportRepository
{
    Task<DailySalesReportDto> GetDailySalesReportAsync(DateTime date, CancellationToken cancellationToken);

    Task<WeeklySalesReportDto> GetWeeklySalesReportAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken);

    Task<List<TopSellingItemDto>> GetTopSellingItemsAsync(DateTime startDate, DateTime endDate, int count, CancellationToken cancellationToken);

    Task<List<HourlySalesDto>> GetPeakHoursAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken);
}