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

    public async Task<DailySalesReportDto> GetDailySalesReportAsync(DateTime date, CancellationToken cancellationToken)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1).AddTicks(-1);

        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= startOfDay && o.CreatedAt <= endOfDay)
            .ToListAsync(cancellationToken);

        var totalRevenue = orders.SelectMany(o => o.OrderItems).Sum(oi => oi.ItemTotal);
        var totalOrders = orders.Count;

        // Get hourly sales breakdown
        var hourlyGroups = orders.SelectMany(o => o.OrderItems)
            .GroupBy(oi => oi.CreatedAt.Hour)
            .Select(g => new HourlySalesDto(g.Key, g.Count(), g.Sum(oi => oi.ItemTotal)))
            .ToList();

        // Get top selling items for the day
        var topSellingItems = orders.SelectMany(o => o.OrderItems)
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

    public async Task<WeeklySalesReportDto> GetWeeklySalesReportAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .ToListAsync(cancellationToken);

        var totalRevenue = orders.SelectMany(o => o.OrderItems).Sum(oi => oi.ItemTotal);
        var totalOrders = orders.Count;

        // Group by date for daily summaries
        var dailySales = orders
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new DailySalesSummaryDto(
                g.Key,
                g.Count(),
                g.SelectMany(o => o.OrderItems).Sum(oi => oi.ItemTotal)
            ))
            .OrderBy(x => x.Date)
            .ToList();

        // Get top selling items for the week
        var topSellingItems = orders.SelectMany(o => o.OrderItems)
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

    public async Task<List<TopSellingItemDto>> GetTopSellingItemsAsync(DateTime startDate, DateTime endDate, int count, CancellationToken cancellationToken)
    {
        var topItems = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .SelectMany(o => o.OrderItems)
            .GroupBy(oi => new { oi.MenuItemId, oi.MenuItemNameSnapshot })
            .Select(g => new TopSellingItemDto(
                g.Key.MenuItemId,
                g.Key.MenuItemNameSnapshot,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.ItemTotal)
            ))
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(count)
            .ToListAsync(cancellationToken);

        return topItems;
    }

    public async Task<List<HourlySalesDto>> GetPeakHoursAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .ToListAsync(cancellationToken);

        var hourlySales = orders.SelectMany(o => o.OrderItems)
            .GroupBy(oi => oi.CreatedAt.Hour)
            .Select(g => new HourlySalesDto(
                g.Key,
                g.Count(),
                g.Sum(oi => oi.ItemTotal)
            ))
            .OrderBy(x => x.Hour)
            .ToList();

        return hourlySales;
    }
}
