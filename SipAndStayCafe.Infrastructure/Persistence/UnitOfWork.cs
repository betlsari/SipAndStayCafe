using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Infrastructure.Persistence.Repositories;

namespace SipAndStayCafe.Infrastructure.Persistence;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly Dictionary<Type, object> _repositories = [];
    private readonly Dictionary<Type, object> _queryableRepositories = [];  // ← ekle

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IRepository<T> Repository<T>() where T : class
    {
        var type = typeof(T);
        if (!_repositories.TryGetValue(type, out var repo))
        {
            repo = new GenericRepository<T>(_context);
            _repositories[type] = repo;
        }
        return (IRepository<T>)repo;
    }
    public IQueryableRepository<T> QueryableRepository<T>() where T : class
    {
        var type = typeof(T);
        if (!_queryableRepositories.TryGetValue(type, out var repo))
        {
            repo = new QueryableRepository<T>(_context);
            _queryableRepositories[type] = repo;
        }
        return (IQueryableRepository<T>)repo;
    }
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    public void Dispose()
        => _context.Dispose();
}