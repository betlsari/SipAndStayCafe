using Microsoft.AspNetCore.Identity;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Infrastructure.Persistence;

namespace SipAndStayCafe.Infrastructure.Services;

/// <summary>
/// Infrastructure implementation of IIdentityService.
/// Wraps ASP.NET Core UserManager — the only place in the codebase that touches it directly.
/// </summary>
public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public IdentityService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<UserDto?> FindByEmailAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null) return null;
        return await ToDto(user);
    }

    public async Task<UserDto?> FindByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return null;
        return await ToDto(user);
    }

    public async Task<bool> CheckPasswordAsync(string userId, string password)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return false;
        return await _userManager.CheckPasswordAsync(user, password);
    }

    public async Task<Application.Interfaces.IdentityResult> CreateUserAsync(
        string email, string password, string displayName, string role)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            EmailConfirmed = true,
        };

        var createResult = await _userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            var errors = createResult.Errors
                .GroupBy(e => e.Code, e => e.Description)
                .ToDictionary(g => g.Key, g => g.ToArray());
            return new Application.Interfaces.IdentityResult(false, errors);
        }

        var roleResult = await _userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user); // rollback
            var errors = roleResult.Errors
                .GroupBy(e => e.Code, e => e.Description)
                .ToDictionary(g => g.Key, g => g.ToArray());
            return new Application.Interfaces.IdentityResult(false, errors);
        }

        return new Application.Interfaces.IdentityResult(true, new Dictionary<string, string[]>());
    }

    private async Task<UserDto> ToDto(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserDto(user.Id, user.Email!, user.DisplayName, roles.ToList().AsReadOnly());
    }
}