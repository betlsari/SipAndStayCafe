
using SipAndStayCafe.Application.DTOs.Auth;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace SipAndStayCafe.Application.Features.Auth;

/// <summary>
/// Handles all authentication business logic.
/// Depends only on Application interfaces — zero Infrastructure references.
/// </summary>
public sealed class AuthService
{
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(30);

    private readonly IIdentityService _identityService;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenRepository _refreshTokenRepo;

    public AuthService(
        IIdentityService identityService,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepo)
    {
        _identityService = identityService;
        _tokenService = tokenService;
        _refreshTokenRepo = refreshTokenRepo;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Login
    // ────────────────────────────────────────────────────────────────────────

    public async Task<Result<AuthResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var userResult = await _identityService.FindByEmailAsync(request.Email);
        if (userResult is null)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        var passwordValid = await _identityService.CheckPasswordAsync(userResult.Id, request.Password);
        if (!passwordValid)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        return await IssueTokensAsync(userResult, cancellationToken);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Register staff  (Owner-only — enforced at controller level)
    // ────────────────────────────────────────────────────────────────────────

    public async Task<Result<AuthResponse>> RegisterStaffAsync(
        RegisterStaffRequest request,
        CancellationToken cancellationToken = default)
    {
        var existing = await _identityService.FindByEmailAsync(request.Email);
        if (existing is not null)
            return Result.Failure<AuthResponse>(
                Error.General.Conflict($"A user with email '{request.Email}' already exists."));

        var createResult = await _identityService.CreateUserAsync(
            request.Email, request.Password, request.DisplayName, request.Role);

        if (!createResult.Succeeded)
            throw new Exceptions.ValidationException(createResult.Errors);

        var user = await _identityService.FindByEmailAsync(request.Email);
        return await IssueTokensAsync(user!, cancellationToken);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Refresh token
    // ────────────────────────────────────────────────────────────────────────

    public async Task<Result<AuthResponse>> RefreshAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        var hash = HashToken(request.RefreshToken);

        var storedToken = await _refreshTokenRepo.GetByHashAsync(hash, cancellationToken);
        if (storedToken is null || !storedToken.IsActive)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        var user = await _identityService.FindByIdAsync(storedToken.UserId);
        if (user is null)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        // Rotate: revoke old, issue new pair
        storedToken.Revoke();
        await _refreshTokenRepo.UpdateAsync(storedToken, cancellationToken);

        return await IssueTokensAsync(user, cancellationToken);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Logout
    // ────────────────────────────────────────────────────────────────────────

    public async Task<Result<bool>> LogoutAsync(
        string rawRefreshToken,
        CancellationToken cancellationToken = default)
    {
        var hash = HashToken(rawRefreshToken);
        var storedToken = await _refreshTokenRepo.GetByHashAsync(hash, cancellationToken);

        if (storedToken is null)
            return Result.Success(true); // already gone — idempotent

        storedToken.Revoke();
        await _refreshTokenRepo.UpdateAsync(storedToken, cancellationToken);

        return Result.Success(true);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────────────────────────────

    private async Task<Result<AuthResponse>> IssueTokensAsync(
        UserDto user,
        CancellationToken cancellationToken)
    {
        var accessToken = _tokenService.GenerateAccessToken(
            user.Id, user.Email, user.DisplayName, user.Roles);
        var rawRefresh = _tokenService.GenerateRefreshToken();
        var expiry = _tokenService.GetAccessTokenExpiry();

        var refreshEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(rawRefresh),
            ExpiresAt = DateTime.UtcNow.Add(RefreshTokenLifetime),
        };

        await _refreshTokenRepo.AddAsync(refreshEntity, cancellationToken);

        return Result.Success(new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefresh,
            AccessTokenExpiry: expiry,
            UserId: user.Id,
            DisplayName: user.DisplayName,
            Roles: user.Roles));
    }

    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}