using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.DTOs.Auth;
using SipAndStayCafe.Application.Features.Auth;
using SipAndStayCafe.Domain.Common;

namespace SipAndStayCafe.WebAPI.Controllers;

/// <summary>
/// Authentication endpoints.
///
/// Public (no auth):  POST /api/auth/login
/// Owner-only:        POST /api/auth/register-staff
/// Authenticated:     POST /api/auth/refresh
/// Authenticated:     POST /api/auth/logout
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Authenticates a staff user and returns a JWT access token + refresh token.
    /// Request is validated by <see cref="Application.Features.Auth.Validators.LoginRequestValidator"/>
    /// via the FluentValidation MediatR pipeline behavior.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var deviceHint = Request.Headers.UserAgent.ToString();
        // Max 200 karakter — RefreshTokenConfiguration'da HasMaxLength(200) var
        if (deviceHint.Length > 200)
            deviceHint = deviceHint[..200];

        var result = await _authService.LoginAsync(request, deviceHint, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : Unauthorized(ProblemFor(result.Error));
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /api/auth/register-staff
    // ────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new staff account with the given role.
    /// Only the Owner role can call this endpoint.
    /// </summary>
    [HttpPost("register-staff")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RegisterStaff(
        [FromBody] RegisterStaffRequest request,
        CancellationToken cancellationToken)
    {
        var deviceHint = Request.Headers.UserAgent.ToString();
        if (deviceHint.Length > 200) deviceHint = deviceHint[..200];

        var result = await _authService.RegisterStaffAsync(request, deviceHint, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "Conflict" => Conflict(ProblemFor(result.Error)),
                _ => BadRequest(ProblemFor(result.Error))
            };
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /api/auth/refresh
    // ────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Exchanges an expired access token + valid refresh token for a new token pair.
    /// Implements refresh token rotation: the submitted token is revoked on success.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous] // The access token may already be expired — we can't require it here
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var deviceHint = Request.Headers.UserAgent.ToString();
        if (deviceHint.Length > 200) deviceHint = deviceHint[..200];

        var result = await _authService.RefreshAsync(request, deviceHint, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : Unauthorized(ProblemFor(result.Error));
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /api/auth/logout
    // ────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Revokes the submitted refresh token. The client must also discard the access token locally.
    /// Idempotent — calling with an already-revoked token returns 204.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(
        [FromBody] string refreshToken,
        CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(refreshToken, cancellationToken);
        return NoContent();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helper
    // ────────────────────────────────────────────────────────────────────────

    private static object ProblemFor(Error error) => new
    {
        code = error.Code,
        message = error.Message
    };
}