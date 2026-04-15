using FluentValidation;
using SipAndStayCafe.Application.DTOs.Auth;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;
using System.Security.Cryptography;
using System.Text;
using ValidationException = SipAndStayCafe.Application.Exceptions.ValidationException;

namespace SipAndStayCafe.Application.Features.Auth;

public sealed class AuthService
{
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(30);

    private readonly IIdentityService _identityService;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RegisterStaffRequest> _registerValidator;
    private readonly IValidator<RefreshTokenRequest> _refreshValidator;

    public AuthService(
        IIdentityService identityService,
        ITokenService tokenService,
        IRefreshTokenRepository refreshTokenRepo,
        IValidator<LoginRequest> loginValidator,
        IValidator<RegisterStaffRequest> registerValidator,
        IValidator<RefreshTokenRequest> refreshValidator)
    {
        _identityService = identityService;
        _tokenService = tokenService;
        _refreshTokenRepo = refreshTokenRepo;
        _loginValidator = loginValidator;
        _registerValidator = registerValidator;
        _refreshValidator = refreshValidator;
    }

    public async Task<Result<AuthResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validation önce çalışsın
        await ValidateAndThrowAsync(_loginValidator, request, cancellationToken);

        var userResult = await _identityService.FindByEmailAsync(request.Email);
        if (userResult is null)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        var passwordValid = await _identityService.CheckPasswordAsync(userResult.Id, request.Password);
        if (!passwordValid)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        return await IssueTokensAsync(userResult, cancellationToken);
    }

    public async Task<Result<AuthResponse>> RegisterStaffAsync(
        RegisterStaffRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAndThrowAsync(_registerValidator, request, cancellationToken);

        var existing = await _identityService.FindByEmailAsync(request.Email);
        if (existing is not null)
            return Result.Failure<AuthResponse>(
                Error.General.Conflict($"A user with email '{request.Email}' already exists."));

        var createResult = await _identityService.CreateUserAsync(
            request.Email, request.Password, request.DisplayName, request.Role);

        if (!createResult.Succeeded)
            throw new ValidationException(createResult.Errors);

        var user = await _identityService.FindByEmailAsync(request.Email);
        return await IssueTokensAsync(user!, cancellationToken);
    }

    public async Task<Result<AuthResponse>> RefreshAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAndThrowAsync(_refreshValidator, request, cancellationToken);

        var hash = HashToken(request.RefreshToken);

        var storedToken = await _refreshTokenRepo.GetByHashAsync(hash, cancellationToken);
        if (storedToken is null || !storedToken.IsActive)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        // Sorun 5 fix: access token'dan userId çıkar ve refresh token userId ile eşleştir
        var userIdFromAccessToken = _tokenService.ExtractUserIdFromToken(request.AccessToken);
        if (userIdFromAccessToken is null || userIdFromAccessToken != storedToken.UserId)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        var user = await _identityService.FindByIdAsync(storedToken.UserId);
        if (user is null)
            return Result.Failure<AuthResponse>(Error.General.Unauthorized());

        storedToken.Revoke();
        await _refreshTokenRepo.UpdateAsync(storedToken, cancellationToken);

        return await IssueTokensAsync(user, cancellationToken);
    }

    public async Task<Result<bool>> LogoutAsync(
        string rawRefreshToken,
        CancellationToken cancellationToken = default)
    {
        var hash = HashToken(rawRefreshToken);
        var storedToken = await _refreshTokenRepo.GetByHashAsync(hash, cancellationToken);

        if (storedToken is null)
            return Result.Success(true);

        storedToken.Revoke();
        await _refreshTokenRepo.UpdateAsync(storedToken, cancellationToken);

        return Result.Success(true);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

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

    private static async Task ValidateAndThrowAsync<T>(
        IValidator<T> validator,
        T instance,
        CancellationToken cancellationToken)
    {
        var result = await validator.ValidateAsync(instance, cancellationToken);
        if (!result.IsValid)
        {
            var errors = result.Errors
                .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
                .ToDictionary(g => g.Key, g => g.ToArray());
            throw new ValidationException(errors);
        }
    }

    // Application katmanında JWT'ye doğrudan bağımlılık olmadan,
    // sadece claim okuma amacıyla minimal bir parse yapıyoruz.
    // Signature doğrulamıyoruz — zaten expired olabilir.
    // Amacımız sadece sub claim'ini okumak.
    private static string? ExtractUserIdFromExpiredToken(string accessToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
            return null;

        try
        {
            // JWT formatı: header.payload.signature
            // Payload'ı base64 decode edip sub claim'i okuyoruz.
            var parts = accessToken.Split('.');
            if (parts.Length != 3)
                return null;

            // Base64Url → Base64 dönüşümü
            var payload = parts[1];
            payload = payload.Replace('-', '+').Replace('_', '/');
            switch (payload.Length % 4)
            {
                case 2: payload += "=="; break;
                case 3: payload += "="; break;
            }

            var json = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payload));
            using var doc = System.Text.Json.JsonDocument.Parse(json);

            // JWT standardı: "sub" claim = userId
            if (doc.RootElement.TryGetProperty("sub", out var sub))
                return sub.GetString();

            return null;
        }
        catch
        {
            return null;
        }
    }
}