namespace SipAndStayCafe.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<T> Repository<T>() where T : class;
    IQueryableRepository<T> QueryableRepository<T>() where T : class;  // ← ekle

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}