namespace SipAndStayCafe.Application.Interfaces;

/// <summary>
/// Abstracts ASP.NET Core Identity's UserManager so the Application layer
/// has zero dependency on Infrastructure or Microsoft.AspNetCore.Identity.
/// Implemented in Infrastructure by IdentityService.
/// </summary>
public interface IIdentityService
{
    Task<UserDto?> FindByEmailAsync(string email);
    Task<UserDto?> FindByIdAsync(string userId);
    Task<bool> CheckPasswordAsync(string userId, string password);
    Task<IdentityResult> CreateUserAsync(string email, string password, string displayName, string role);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task DeleteUserAsync(string id, CancellationToken ct);

}

/// <summary>
/// Lightweight user data transfer object returned by IIdentityService.
/// Application layer works with this — never with ApplicationUser directly.
/// </summary>
public sealed record UserDto(
    string Id,
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles);

/// <summary>
/// Result of a user creation operation.
/// Mirrors IdentityResult without pulling in the Identity package.
/// </summary>
public sealed record IdentityResult(
    bool Succeeded,
    IDictionary<string, string[]> Errors);