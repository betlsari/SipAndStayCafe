using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.DTOs.Auth;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;


namespace SipAndStayCafe.Application.Features.Auth;

/// <summary>
/// Application katmanında yaşar.
/// Infrastructure veya Identity'ye doğrudan bağımlılık YOKTUR.
/// Tüm kimlik işlemleri IIdentityService üzerinden soyutlanmıştır.
/// </summary>
public sealed class AuthService
{
    private readonly IIdentityService _identityService;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IIdentityService identityService,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepo,
        ILogger<AuthService> logger)
    {
        _identityService = identityService;
        _tokenService = tokenService;
        _refreshTokenRepo = refreshTokenRepo;
        _logger = logger;
    }

    // ── Login ────────────────────────────────────────────────────────────────

    public async Task<Result<AuthResponse>> LoginAsync(
        LoginRequest request,
        string deviceHint,
        CancellationToken cancellationToken = default)
    {
        // 1. Kullanıcıyı e-posta ile bul
        var userDto = await _identityService.FindByEmailAsync(request.Email);
        if (userDto is null)
        {
            _logger.LogWarning("[Auth] Login failed - user not found: {Email}", request.Email);
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());
        }

        // 2. Şifreyi doğrula
        var passwordValid = await _identityService.CheckPasswordAsync(userDto.Id, request.Password);
        if (!passwordValid)
        {
            _logger.LogWarning("[Auth] Login failed - wrong password: {Email}", request.Email);
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());
        }

        _logger.LogInformation("[Auth] Login successful: {Email} | Roles: {Roles}",
            request.Email, string.Join(", ", userDto.Roles));

        return await IssueTokenPairAsync(userDto, deviceHint, cancellationToken);
    }

    // ── Register Staff ───────────────────────────────────────────────────────

    public async Task<Result<AuthResponse>> RegisterStaffAsync(
        RegisterStaffRequest request,
        string deviceHint,
        CancellationToken cancellationToken = default)
    {
        string[] validRoles = ["Owner", "Cashier", "KitchenStaff"];
        if (!validRoles.Contains(request.Role))
            return Result.Failure<AuthResponse>(
                Error.General.Validation($"Geçersiz rol: {request.Role}"));

        var existing = await _identityService.FindByEmailAsync(request.Email);
        if (existing is not null)
            return Result.Failure<AuthResponse>(
                Error.General.Conflict($"Bu e-posta zaten kullanımda: {request.Email}"));

        var createResult = await _identityService.CreateUserAsync(
            request.Email, request.Password, request.DisplayName, request.Role);

        if (!createResult.Succeeded)
        {
            var firstError = createResult.Errors.Values
                .SelectMany(e => e)
                .FirstOrDefault() ?? "Kullanıcı oluşturulamadı.";
            return Result.Failure<AuthResponse>(Error.General.Validation(firstError));
        }

        var userDto = await _identityService.FindByEmailAsync(request.Email);
        if (userDto is null)
            return Result.Failure<AuthResponse>(Error.General.Unexpected());

        return await IssueTokenPairAsync(userDto, deviceHint, cancellationToken);
    }

    // ── Refresh ──────────────────────────────────────────────────────────────

    public async Task<Result<AuthResponse>> RefreshAsync(
        RefreshTokenRequest request,
        string deviceHint,
        CancellationToken cancellationToken = default)
    {
        var userId = ExtractUserIdFromExpiredToken(request.AccessToken);
        if (userId is null)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        var tokenHash = HashToken(request.RefreshToken);
        var storedToken = await _refreshTokenRepo.GetByHashAsync(tokenHash, cancellationToken);

        if (storedToken is null || !storedToken.IsActive || storedToken.UserId != userId)
        {
            _logger.LogWarning("[Auth] Refresh failed - invalid token for userId: {UserId}", userId);
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());
        }

        var userDto = await _identityService.FindByIdAsync(userId);
        if (userDto is null)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        // Token rotation — eski iptal, yeni ver
        storedToken.Revoke();
        await _refreshTokenRepo.UpdateAsync(storedToken, cancellationToken);

        return await IssueTokenPairAsync(userDto, deviceHint, cancellationToken);
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    public async Task LogoutAsync(
        string rawRefreshToken,
        CancellationToken cancellationToken = default)
    {
        var tokenHash = HashToken(rawRefreshToken);
        var storedToken = await _refreshTokenRepo.GetByHashAsync(tokenHash, cancellationToken);

        if (storedToken is not null && storedToken.IsActive)
        {
            storedToken.Revoke();
            await _refreshTokenRepo.UpdateAsync(storedToken, cancellationToken);
        }
        // Idempotent
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private async Task<Result<AuthResponse>> IssueTokenPairAsync(
        UserDto userDto,
        string deviceHint,
        CancellationToken cancellationToken)
    {
        var accessToken = _tokenService.GenerateAccessToken(
            userDto.Id, userDto.Email, userDto.DisplayName, userDto.Roles);
        var accessExpiry = _tokenService.GetAccessTokenExpiry();

        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var tokenHash = HashToken(rawRefreshToken);
        var hint = deviceHint.Length > 200 ? deviceHint[..200] : deviceHint;

        var refreshTokenEntity = new RefreshToken
        {
            UserId = userDto.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            DeviceHint = hint,
        };

        await _refreshTokenRepo.AddAsync(refreshTokenEntity, cancellationToken);

        return Result.Success(new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            AccessTokenExpiry: accessExpiry,
            UserId: userDto.Id,
            DisplayName: userDto.DisplayName,
            Roles: userDto.Roles));
    }

    private static string? ExtractUserIdFromExpiredToken(string accessToken)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(accessToken);
            return jwt.Subject;
        }
        catch { return null; }
    }

    public static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}