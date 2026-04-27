using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Entities;
using SipAndStayCafe.Infrastructure.Persistence;

namespace SipAndStayCafe.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job that runs every night at midnight (UTC).
///
/// What it does:
///
///   1. RESET — Sets <see cref="MenuItem.IsAvailable"/> = <c>true</c> for ALL active items.
///              This is the "start of day" default: every item is assumed to be in stock
///              until the owner explicitly marks it as out of stock from the admin panel.
///
///   2. NOTIFY — Finds items that have no <see cref="StockUpdate"/> record for today and
///               logs a warning (or sends a push notification once the admin hub is wired).
///               This reminds the owner to review stock for items that need daily decisions
///               (e.g. seasonal specials with limited quantity).
///
/// Why reset to true?
///   The system is designed for a single-location cafe where the owner checks stock every
///   morning.  Resetting to available ensures that if the owner forgets to log into the
///   admin panel, customers can still order — the worst case is ordering something that
///   turns out to be unavailable, which the staff can handle verbally.
///   The alternative (resetting to false) would silently hide all items and prevent orders,
///   which is worse for a busy cafe.
///
/// Idempotency:
///   Running the job twice on the same day is safe — the reset just overwrites the same
///   value, and the StockUpdate upsert uses the (MenuItemId, Date) unique index.
///
/// Registration:
///   See <c>Program.cs</c> → <c>RecurringJob.AddOrUpdate&lt;StockResetJob&gt;</c>.
/// </summary>
public sealed class StockResetJob
{
    private readonly AppDbContext _db;
    private readonly IMenuCacheService _cache;
    private readonly IStockNotificationService _notifications;
    private readonly ILogger<StockResetJob> _logger;

    public StockResetJob(
        AppDbContext db,
        IMenuCacheService cache,
        IStockNotificationService notifications,
        ILogger<StockResetJob> logger)
    {
        _db = db;
        _cache = cache;
        _notifications = notifications;
        _logger = logger;
    }

    /// <summary>Entry point called by Hangfire.</summary>
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        _logger.LogInformation("[StockResetJob] Starting nightly stock reset for {Date}.", today);

        // ── Step 1: Reset all items to available ────────────────────────────
        // We use a direct EF Core ExecuteUpdateAsync (EF 7+) for a single bulk UPDATE
        // instead of loading every row into memory — more efficient for large menus.
        var resetCount = await _db.MenuItems
    .Where(m => !m.IsAvailable)
    .ExecuteUpdateAsync(s => s
        .SetProperty(m => m.IsAvailable, true)
        .SetProperty(m => m.UpdatedAt, DateTime.UtcNow),
        cancellationToken);
        _logger.LogInformation(
            "[StockResetJob] Reset {Count} item(s) to available.", resetCount);

        // ── Step 2: Find items with no StockUpdate record for today ─────────
        // These are items the owner has never explicitly configured today.
        // We notify so the owner knows to review them.
        var allItemIds = await _db.MenuItems
            .Select(m => m.Id)
            .ToListAsync(cancellationToken);

        var configuredToday = (await _db.StockUpdates
     .Where(s => s.Date == today)
     .Select(s => s.MenuItemId)
     .ToListAsync(cancellationToken))
     .ToHashSet();

        var unconfigured = allItemIds
            .Where(id => !configuredToday.Contains(id))
            .ToList()
            .AsReadOnly();

        await _notifications.NotifyStockNotConfiguredAsync(unconfigured, cancellationToken);

        // ── Step 3: Invalidate the Redis menu cache ──────────────────────────
        // The public menu endpoint serves data from cache; after resetting availability
        // the cache must be cleared so the next request re-fetches from the database.
        await _cache.InvalidateMenuAsync(cancellationToken);

        _logger.LogInformation(
            "[StockResetJob] Completed. Reset={Reset}, Unconfigured={Unconfigured}.",
            resetCount, unconfigured.Count);
    }
}