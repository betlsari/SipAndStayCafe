namespace SipAndStayCafe.Application.DTOs.Auth;

// ────────────────────────────────────────────────────────────────────────────
// Request DTOs  (what the client sends)
// ────────────────────────────────────────────────────────────────────────────

/// <summary>Login request payload.</summary>
public sealed record LoginRequest(
    string Email,
    string Password);

/// <summary>
/// Staff account creation request.
/// Only an Owner can call this endpoint.
/// </summary>
public sealed record RegisterStaffRequest(
    string Email,
    string Password,
    string DisplayName,

    /// <summary>Must be one of: Owner, Cashier, KitchenStaff</summary>
    string Role);

/// <summary>Used by the client to exchange a refresh token for a new access token.</summary>
public sealed record RefreshTokenRequest(
    string AccessToken,
    string RefreshToken);

// ────────────────────────────────────────────────────────────────────────────
// Response DTOs  (what the API returns)
// ────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Returned on successful login or token refresh.
/// The client stores AccessToken in memory and RefreshToken in an HttpOnly cookie
/// (or secure storage on mobile).
/// </summary>
public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiry,
    string UserId,
    string DisplayName,
    IReadOnlyList<string> Roles);