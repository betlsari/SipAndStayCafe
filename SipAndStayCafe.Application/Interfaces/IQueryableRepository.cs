using System.Linq.Expressions;

namespace SipAndStayCafe.Application.Interfaces;

/// <summary>
/// IRepository'nin Include/eager loading desteği olan genişletmesi.
/// Karmaşık join gerektiren sorgular için kullanılır.
/// Application katmanı bu interface'e bağımlı — EF Core'a bağımlılık yok.
/// </summary>
public interface IQueryableRepository<T> where T : class
{
    /// <summary>
    /// Tek bir entity'yi navigation property'leriyle birlikte getirir.
    /// include parametresi: q => q.Include(x => x.Category).ThenInclude(...)
    /// </summary>
    Task<T?> GetByIdWithIncludesAsync(
        Guid id,
        Func<IQueryable<T>, IQueryable<T>> include,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Filtrelenmiş listeyi navigation property'leriyle birlikte getirir.
    /// </summary>
    Task<IReadOnlyList<T>> FindWithIncludesAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IQueryable<T>> include,
        CancellationToken cancellationToken = default);
}