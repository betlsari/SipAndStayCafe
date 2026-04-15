namespace SipAndStayCafe.Application.Interfaces;

/// <summary>
/// Abstraction for JWT access token and refresh token generation.
/// Implementation lives in Infrastructure so the Application layer
/// stays free of JWT library dependencies.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generates a signed JWT access token for the given user.
    /// </summary>
    /// <param name="userId">The Identity user ID.</param>
    /// <param name="email">The user's email address (included as a claim).</param>
    /// <param name="displayName">Human-readable name (included as a claim).</param>
    /// <param name="roles">All roles assigned to this user.</param>
    /// <returns>A signed JWT string ready to be returned to the client.</returns>
    string GenerateAccessToken(
        string userId,
        string email,
        string displayName,
        IEnumerable<string> roles);

    /// <summary>
    /// Generates a cryptographically random, opaque refresh token string.
    /// The caller is responsible for storing its hash in the database.
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Returns the expiry UTC timestamp for a newly created access token.
    /// Clients use this to schedule proactive token refresh.
    /// </summary>
    DateTime GetAccessTokenExpiry();

    // ITokenService.cs'e ekle
    /// <summary>
    /// Expired olsa bile access token'dan userId (sub claim) çıkarır.
    /// Signature doğrulaması yapılmaz — sadece claim okuma amaçlı.
    /// </summary>
    string? ExtractUserIdFromToken(string accessToken);
}