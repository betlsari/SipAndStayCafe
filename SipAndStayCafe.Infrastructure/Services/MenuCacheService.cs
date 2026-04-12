using Microsoft.Extensions.Caching.Distributed;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Application.Interfaces;
using System.Text.Json;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// Redis implementation of <see cref="IMenuCacheService"/>.
/// Uses IDistributedCache (registered via AddStackExchangeRedisCache in DI).
///
/// Cache key strategy:
///   menu:public  — the full serialized public menu list
///
/// TTL: 12 hours — menus don't change that often.
/// Invalidation: explicit delete on any write operation (no time-based staleness needed
/// because the owner controls all changes and triggers invalidation manually).
/// </summary>
public sealed class MenuCacheService : IMenuCacheService
{
    private const string PublicMenuKey = "menu:public";
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromHours(12);

    private readonly IDistributedCache _cache;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    public MenuCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<IReadOnlyList<MenuCategoryDto>?> GetPublicMenuAsync(
        CancellationToken ct = default)
    {
        var json = await _cache.GetStringAsync(PublicMenuKey, ct);
        if (string.IsNullOrEmpty(json)) return null;

        return JsonSerializer.Deserialize<List<MenuCategoryDto>>(json, JsonOptions)
               as IReadOnlyList<MenuCategoryDto>;
    }

    public async Task SetPublicMenuAsync(
        IReadOnlyList<MenuCategoryDto> menu, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(menu, JsonOptions);
        await _cache.SetStringAsync(PublicMenuKey, json, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = DefaultTtl
        }, ct);
    }

    public async Task InvalidateMenuAsync(CancellationToken ct = default)
    {
        await _cache.RemoveAsync(PublicMenuKey, ct);
    }
}