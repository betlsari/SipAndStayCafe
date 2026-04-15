using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.Interfaces;
using System.Linq.Expressions;

namespace SipAndStayCafe.Infrastructure.Persistence.Repositories;

public sealed class QueryableRepository<T> : IQueryableRepository<T> where T : class
{
    private readonly AppDbContext _context;

    public QueryableRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<T?> GetByIdWithIncludesAsync(
        Guid id,
        Func<IQueryable<T>, IQueryable<T>> include,
        CancellationToken cancellationToken = default)
    {
        var query = include(_context.Set<T>().AsNoTracking());

        // EF Core'un FindAsync'i include desteklemez — bu yüzden manuel filtre
        // T'nin Id property'sini bulmak için shadow property yerine convention kullanıyoruz
        // Tüm entity'ler BaseEntity'den türüyor ve Guid Id'ye sahip
        return await query
            .FirstOrDefaultAsync(
                e => EF.Property<Guid>(e, "Id") == id,
                cancellationToken);
    }

    public async Task<IReadOnlyList<T>> FindWithIncludesAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IQueryable<T>> include,
        CancellationToken cancellationToken = default)
    {
        var query = include(_context.Set<T>().AsNoTracking());
        return await query.Where(predicate).ToListAsync(cancellationToken);
    }
}