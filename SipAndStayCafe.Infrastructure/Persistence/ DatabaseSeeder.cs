using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SipAndStayCafe.Infrastructure.Persistence;

namespace SipAndStayCafe.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    // ════════════════════════════════════════════════════════════
    //  DEĞİŞTİRMEK İSTERSENİZ BURADAN DEĞİŞTİRİN
    // ════════════════════════════════════════════════════════════
    private const string OwnerEmail = "admin@sipandstay.com";
    private const string OwnerPassword = "Admin123!";
    private const string OwnerDisplayName = "Cafe Sahibi";
    // ════════════════════════════════════════════════════════════

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider
            .GetRequiredService<UserManager<ApplicationUser>>();

        var roleManager = serviceProvider
            .GetRequiredService<RoleManager<IdentityRole>>();

        var logger = serviceProvider
            .GetRequiredService<ILogger<AppDbContext>>();

        // ── 1. Rolleri oluştur ───────────────────────────────────────────────
        string[] roles = ["Owner", "Cashier", "KitchenStaff"];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole(role));
                if (roleResult.Succeeded)
                    logger.LogInformation("[Seed] Role created: {Role}", role);
                else
                    logger.LogError("[Seed] Role creation failed: {Role} — {Errors}",
                        role, string.Join(", ", roleResult.Errors.Select(e => e.Description)));
            }
        }

        // ── 2. Owner hesabını oluştur ────────────────────────────────────────
        var existingOwner = await userManager.FindByEmailAsync(OwnerEmail);

        if (existingOwner is null)
        {
            var owner = new ApplicationUser
            {
                UserName = OwnerEmail,
                Email = OwnerEmail,
                DisplayName = OwnerDisplayName,
                EmailConfirmed = true,   // Onay e-postası gerekmez
            };

            // ÖNEMLİ: Şifreyi CreateAsync ile ver — hash'i doğru oluşturur
            var createResult = await userManager.CreateAsync(owner, OwnerPassword);

            if (createResult.Succeeded)
            {
                var roleResult = await userManager.AddToRoleAsync(owner, "Owner");

                if (roleResult.Succeeded)
                {
                    logger.LogInformation(
                        "[Seed] Owner account created successfully. Email: {Email} | Password: {Password}",
                        OwnerEmail, OwnerPassword);
                }
                else
                {
                    logger.LogError("[Seed] Role assignment failed: {Errors}",
                        string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                }
            }
            else
            {
                // Hata genellikle: şifre zayıf, email format hatası
                var errors = string.Join(" | ", createResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                logger.LogError("[Seed] Owner creation failed: {Errors}", errors);
            }
        }
        else
        {
            // Kullanıcı var ama rolü yoksa ekle
            var roles2 = await userManager.GetRolesAsync(existingOwner);
            if (!roles2.Contains("Owner"))
            {
                await userManager.AddToRoleAsync(existingOwner, "Owner");
                logger.LogInformation("[Seed] Owner role added to existing user: {Email}", OwnerEmail);
            }
            else
            {
                logger.LogInformation("[Seed] Owner already exists, skipping: {Email}", OwnerEmail);
            }
        }
    }
}