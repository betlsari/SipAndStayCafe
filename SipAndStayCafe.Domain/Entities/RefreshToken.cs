using SipAndStayCafe.Domain.Common;

namespace SipAndStayCafe.Domain.Entities;

/// <summary>
/// Persisted refresh token associated with a staff user.
///
/// Only the SHA-256 hash of the token is stored — never the raw token value.
/// This means a database breach does not expose usable refresh tokens.
///
/// Lifecycle:
///   1. Generated at login → stored (hashed) here.
///   2. Client sends raw token on refresh → server hashes it and looks up this record.
///   3. On successful refresh → old record revoked, new one created (rotation).
///   4. On logout → record revoked.
///   5. Hangfire nightly job deletes expired + revoked records older than 30 days.
/// </summary>
public sealed class RefreshToken : BaseEntity
{
    /// <summary>ASP.NET Core Identity user ID (string FK).</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// SHA-256 hash (hex) of the opaque refresh token string.
    /// Never store the raw token.
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>UTC expiry. Tokens are invalid after this point regardless of revocation status.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// UTC timestamp when this token was revoked (logout or rotation).
    /// <c>null</c> means the token is still active.
    /// </summary>
    public DateTime? RevokedAt { get; private set; }

    /// <summary>Device/browser hint stored for the user's active sessions view. Optional.</summary>
    public string? DeviceHint { get; set; }

    // -----------------------------------------------------------------------
    // Computed helpers
    // -----------------------------------------------------------------------

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsActive => !IsExpired && !IsRevoked;

    // -----------------------------------------------------------------------
    // Domain behaviour
    // -----------------------------------------------------------------------

    public void Revoke()
    {
        if (IsRevoked) return; // idempotent
        RevokedAt = DateTime.UtcNow;
    }
}