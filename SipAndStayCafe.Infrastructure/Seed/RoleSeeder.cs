using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SipAndStayCafe.Infrastructure.Persistence;

namespace SipAndStayCafe.Infrastructure.Seed;

/// <summary>
/// Seeds the three application roles and the initial Owner account on first startup.
///
/// Called from Program.cs AFTER app.Build() but BEFORE app.Run():
/// <code>
///   await RoleSeeder.SeedAsync(app);
/// </code>
///
/// Design decisions:
/// - Idempotent: safe to run on every startup, skips already-existing roles/users.
/// - Initial owner credentials come from appsettings / environment variables
///   (section "Seed:Owner") so they are never hardcoded.
/// - The initial owner account creation is skipped if ANY Owner-role user already exists,
///   preventing accidental recreation after the owner changes their password.
/// </summary>
public static class RoleSeeder
{
    public static readonly string[] ApplicationRoles =
    [
        "Owner",
        "Cashier",
        "KitchenStaff"
    ];

    public static async Task SeedAsync(IHost app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;

        var logger = services.GetRequiredService<ILogger<ApplicationUser>>();

        try
        {
            await SeedRolesAsync(services, logger);
            await SeedInitialOwnerAsync(services, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding roles and initial owner account.");
            throw; // fail fast — don't start with a broken auth setup
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Seed roles
    // ────────────────────────────────────────────────────────────────────────

    private static async Task SeedRolesAsync(
        IServiceProvider services,
        ILogger logger)
    {
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        foreach (var roleName in ApplicationRoles)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                logger.LogDebug("Role '{Role}' already exists — skipping.", roleName);
                continue;
            }

            var result = await roleManager.CreateAsync(new ApplicationRole(roleName));

            if (result.Succeeded)
                logger.LogInformation("Created role '{Role}'.", roleName);
            else
                logger.LogError(
                    "Failed to create role '{Role}': {Errors}",
                    roleName,
                    string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Seed initial owner account
    // ────────────────────────────────────────────────────────────────────────

    private static async Task SeedInitialOwnerAsync(
        IServiceProvider services,
        ILogger logger)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = services.GetRequiredService<IConfiguration>();

        // Skip if an Owner already exists — don't recreate on subsequent startups
        var existingOwners = await userManager.GetUsersInRoleAsync("Owner");
        if (existingOwners.Count > 0)
        {
            logger.LogDebug("Owner account already exists — skipping seed.");
            return;
        }

        // Read from config (environment-variable override recommended for production)
        //
        // appsettings.json example:
        //   "Seed": {
        //     "Owner": {
        //       "Email":       "owner@sipandstay.com",
        //       "Password":    "CHANGE_ME_immediately!",
        //       "DisplayName": "Cafe Owner"
        //     }
        //   }
        //
        // Production override via env variable:
        //   Seed__Owner__Email=...
        //   Seed__Owner__Password=...

        var email = configuration["Seed:Owner:Email"];
        var password = configuration["Seed:Owner:Password"];
        var displayName = configuration["Seed:Owner:DisplayName"] ?? "Owner";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning(
                "Seed:Owner:Email or Seed:Owner:Password is not configured. " +
                "Initial owner account will NOT be created. " +
                "Set these values in appsettings.Development.json or via environment variables.");
            return;
        }

        var owner = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            EmailConfirmed = true, // skip email confirmation for staff accounts
        };

        var createResult = await userManager.CreateAsync(owner, password);
        if (!createResult.Succeeded)
        {
            logger.LogError(
                "Failed to create initial Owner account: {Errors}",
                string.Join(", ", createResult.Errors.Select(e => e.Description)));
            return;
        }

        var roleResult = await userManager.AddToRoleAsync(owner, "Owner");
        if (roleResult.Succeeded)
            logger.LogInformation(
                "Initial Owner account created for '{Email}'. Change the password immediately.",
                email);
        else
            logger.LogError(
                "Owner account created but role assignment failed: {Errors}",
                string.Join(", ", roleResult.Errors.Select(e => e.Description)));
    }
}