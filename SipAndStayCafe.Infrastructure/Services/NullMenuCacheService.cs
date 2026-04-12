using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// No-op implementation of <see cref="IMenuCacheService"/> used when Redis is not configured
/// (e.g. in development without a Redis instance).
/// Always returns null on get (cache miss) and silently ignores set/invalidate.
/// </summary>
public sealed class NullMenuCacheService : IMenuCacheService
{
    public Task<IReadOnlyList<MenuCategoryDto>?> GetPublicMenuAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<MenuCategoryDto>?>(null);

    public Task SetPublicMenuAsync(IReadOnlyList<MenuCategoryDto> menu, CancellationToken ct = default)
        => Task.CompletedTask;

    public Task InvalidateMenuAsync(CancellationToken ct = default)
        => Task.CompletedTask;
}