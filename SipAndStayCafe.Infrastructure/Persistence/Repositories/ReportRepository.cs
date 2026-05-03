using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.DTOs.Report;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Persistence.Repositories;

public sealed class ReportRepository : IReportRepository
{
    private readonly AppDbContext _context;

    public ReportRepository(AppDbContext context)
    {
        _context = context;
    }

    // DateTime.Kind=Unspecified olan deðerleri UTC'ye çevirir
    private static DateTime ToUtc(DateTime dt)
        => dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    public async Task<DailySalesReportDto> GetDailySalesReportAsync(DateTime date, CancellationToken cancellationToken)
    {
        var startOfDay = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var endOfDay = DateTime.SpecifyKind(date.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= startOfDay && o.CreatedAt <= endOfDay)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var allItems = orders.SelectMany(o => o.OrderItems).ToList();

        var totalRevenue = allItems.Sum(oi => oi.ItemTotal);
        var totalOrders = orders.Count;

        var hourlyGroups = orders
            .GroupBy(o => o.CreatedAt.Hour)
            .Select(g => new HourlySalesDto(
                g.Key,
                g.Count(),
                g.SelectMany(o => o.OrderItems).Sum(oi => oi.ItemTotal)
            ))
            .OrderBy(x => x.Hour)
            .ToList();

        var topSellingItems = allItems
            .GroupBy(oi => new { oi.MenuItemId, oi.MenuItemNameSnapshot })
            .Select(g => new TopSellingItemDto(
                g.Key.MenuItemId,
                g.Key.MenuItemNameSnapshot,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.ItemTotal)
            ))
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(10)
            .ToList();

        return new DailySalesReportDto(
            date,
            totalRevenue,
            totalOrders,
            hourlyGroups,
            topSellingItems
        );
    }

    public async Task<WeeklySalesReportDto> GetWeeklySalesReportAsync(
        DateTime startDate, DateTime endDate, CancellationToken cancellationToken)
    {
        var start = ToUtc(startDate);
        var end = ToUtc(endDate);

        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var allItems = orders.SelectMany(o => o.OrderItems).ToList();

        var totalRevenue = allItems.Sum(oi => oi.ItemTotal);
        var totalOrders = orders.Count;

        var dailySales = orders
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new DailySalesSummaryDto(
                g.Key,
                g.Count(),
                g.SelectMany(o => o.OrderItems).Sum(oi => oi.ItemTotal)
            ))
            .OrderBy(x => x.Date)
            .ToList();

        var topSellingItems = allItems
            .GroupBy(oi => new { oi.MenuItemId, oi.MenuItemNameSnapshot })
            .Select(g => new TopSellingItemDto(
                g.Key.MenuItemId,
                g.Key.MenuItemNameSnapshot,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.ItemTotal)
            ))
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(10)
            .ToList();

        return new WeeklySalesReportDto(
            startDate,
            endDate,
            totalRevenue,
            totalOrders,
            dailySales,
            topSellingItems
        );
    }

    public async Task<List<TopSellingItemDto>> GetTopSellingItemsAsync(
        DateTime startDate, DateTime endDate, int count, CancellationToken cancellationToken)
    {
        var start = ToUtc(startDate);
        var end = ToUtc(endDate);

        var items = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
            .AsNoTracking()
            .SelectMany(o => o.OrderItems)
            .ToListAsync(cancellationToken);

        var topItems = items
            .GroupBy(oi => new { oi.MenuItemId, oi.MenuItemNameSnapshot })
            .Select(g => new TopSellingItemDto(
                g.Key.MenuItemId,
                g.Key.MenuItemNameSnapshot,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.ItemTotal)
            ))
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(count)
            .ToList();

        return topItems;
    }

    public async Task<List<HourlySalesDto>> GetPeakHoursAsync(
        DateTime startDate, DateTime endDate, CancellationToken cancellationToken)
    {
        var start = ToUtc(startDate);
        var end = ToUtc(endDate);

        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var hourlySales = orders
            .GroupBy(o => o.CreatedAt.Hour)
            .Select(g => new HourlySalesDto(
                g.Key,
                g.Count(),
                g.SelectMany(o => o.OrderItems).Sum(oi => oi.ItemTotal)
            ))
            .OrderBy(x => x.Hour)
            .ToList();

        return hourlySales;
    }
}