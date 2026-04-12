using SipAndStayCafe.Application.DTOs.Menu;

namespace SipAndStayCafe.Application.Interfaces;

/// <summary>
/// Abstraction for caching the public menu.
/// Implementation (Redis) lives in Infrastructure.
/// The Application layer calls this to read from cache and invalidate on changes.
/// </summary>
public interface IMenuCacheService
{
    /// <summary>
    /// Returns the full public menu from cache, or null if the cache is cold.
    /// Call <see cref="SetPublicMenuAsync"/> after fetching from DB on a cache miss.
    /// </summary>
    Task<IReadOnlyList<MenuCategoryDto>?> GetPublicMenuAsync(CancellationToken ct = default);

    /// <summary>Writes the full public menu to cache.</summary>
    Task SetPublicMenuAsync(IReadOnlyList<MenuCategoryDto> menu, CancellationToken ct = default);

    /// <summary>
    /// Invalidates ALL menu-related cache entries.
    /// Must be called after any menu/stock/category change so the next request re-fetches from DB.
    /// </summary>
    Task InvalidateMenuAsync(CancellationToken ct = default);
}