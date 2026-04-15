using Hangfire.Dashboard;
using Microsoft.AspNetCore.Http;

namespace SipAndStayCafe.Infrastructure.Hangfire;

/// <summary>
/// Hangfire dashboard authorization filter.
///
/// Strategy (layered):
///   1. Development: allow localhost requests unconditionally (matches the
///      original <c>LocalRequestsOnlyAuthorizationFilter</c> behaviour).
///   2. Production: require an authenticated user in the "Owner" role.
///      The dashboard is accessed via a browser session; the JWT is read
///      from the cookie set by the frontend (if any) or the Authorization
///      header for API clients.
///
/// TODO (post-MVP): replace with a proper cookie-based session so the owner
/// can log in through the admin panel and have the dashboard auto-authorized.
/// </summary>
public sealed class OwnerHangfireAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // ── 1. Always allow localhost in development ──────────────────────
        var env = httpContext.RequestServices
            .GetService(typeof(Microsoft.AspNetCore.Hosting.IWebHostEnvironment))
            as Microsoft.AspNetCore.Hosting.IWebHostEnvironment;

        if (env?.EnvironmentName == "Development")
        {
            var host = httpContext.Request.Host.Host;
            if (host == "localhost" || host == "127.0.0.1" || host == "::1")
                return true;
        }

        // ── 2. Production: require authenticated Owner ────────────────────
        var user = httpContext.User;
        return user.Identity?.IsAuthenticated == true
               && user.IsInRole("Owner");
    }
}