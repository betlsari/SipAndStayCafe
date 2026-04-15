using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SipAndStayCafe.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// Concrete JWT implementation of <see cref="ITokenService"/>.
///
/// Configuration keys read from appsettings.json (section "Jwt"):
///   Jwt:SecretKey      — HS256 signing key (min 32 chars / 256 bits)
///   Jwt:Issuer         — e.g. "SipAndStayCafe.API"
///   Jwt:Audience       — e.g. "SipAndStayCafe.Clients"
///   Jwt:ExpiryMinutes  — access token lifetime (e.g. 480 = 8 hours)
///
/// Refresh token lifetime is fixed at 30 days (configurable via constant).
/// </summary>
public sealed class JwtTokenService : ITokenService
{
    private const int RefreshTokenExpiryDays = 30;

    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;

    public JwtTokenService(IConfiguration configuration)
    {
        _secretKey = configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey is missing from configuration.");

        _issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer is missing from configuration.");

        _audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience is missing from configuration.");

        _expiryMinutes = configuration.GetValue<int>("Jwt:ExpiryMinutes", 480);

        if (_secretKey.Length < 32)
            throw new InvalidOperationException(
                "Jwt:SecretKey must be at least 32 characters (256 bits) for HS256.");
    }
    // JwtTokenService.cs'e ekle
    public string? ExtractUserIdFromToken(string accessToken)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            // ValidateToken ÇAĞIRMA — token expired olabilir
            var jwt = handler.ReadJwtToken(accessToken);
            return jwt.Subject; // = sub claim
        }
        catch
        {
            return null;
        }
    }
    /// <inheritdoc/>
    public string GenerateAccessToken(
        string userId,
        string email,
        string displayName,
        IEnumerable<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new("displayName",                 displayName),
        };

        // Add one claim per role so ASP.NET Core's [Authorize(Roles = "...")] works
        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(_expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <inheritdoc/>
    public string GenerateRefreshToken()
    {
        // 64 random bytes → base64url → 86-char opaque token
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    /// <inheritdoc/>
    public DateTime GetAccessTokenExpiry()
        => DateTime.UtcNow.AddMinutes(_expiryMinutes);

    /// <summary>
    /// Returns the UTC expiry for a newly issued refresh token.
    /// Used by the auth service when persisting the RefreshToken record.
    /// </summary>
    public DateTime GetRefreshTokenExpiry()
        => DateTime.UtcNow.AddDays(RefreshTokenExpiryDays);
}