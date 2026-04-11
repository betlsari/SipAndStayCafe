using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Application.Interfaces;

/// <summary>
/// Repository abstraction for RefreshToken persistence.
/// Keeps Application layer free of EF Core / DbContext references.
/// Implemented in Infrastructure by RefreshTokenRepository.
/// </summary>
public interface IRefreshTokenRepository
{
    /// <summary>Looks up an active token by its SHA-256 hash.</summary>
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken = default);

    /// <summary>Persists a new refresh token record.</summary>
    Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default);

    /// <summary>Persists changes to an existing refresh token (e.g. revocation).</summary>
    Task UpdateAsync(RefreshToken token, CancellationToken cancellationToken = default);
}