using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SipAndStayCafe.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Infrastructure
{

    /// <summary>
    /// Extension method that registers all Infrastructure-layer services
    /// (EF Core, repositories, Redis, Hangfire, etc.) into the DI container.
    /// </summary>
    /// <remarks>
    /// <para>
    /// <b>Why a single entry point?</b> Keeping all infrastructure wiring behind
    /// <c>AddInfrastructure</c> means <c>Program.cs</c> in the API layer stays
    /// decoupled from the concrete libraries used in the Infrastructure layer.
    /// Switching databases or caching providers is a single-file change here,
    /// invisible to the API project.
    /// </para>
    /// </remarks>
    public static class DependencyInjection
    {
        /// <summary>
        /// Registers Infrastructure services: PostgreSQL via Npgsql EF Core provider,
        /// ASP.NET Core Identity, and (in future iterations) Redis, Hangfire, etc.
        /// </summary>
        /// <param name="services">The application's service collection.</param>
        /// <param name="configuration">
        ///     The merged configuration root (appsettings.json + environment variables).
        ///     Must contain a <c>ConnectionStrings:DefaultConnection</c> entry.
        /// </param>
        /// <returns>The same <see cref="IServiceCollection"/> for chaining.</returns>
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // ------------------------------------------------------------------
            // 1. PostgreSQL — Npgsql EF Core provider
            // ------------------------------------------------------------------
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "Connection string 'DefaultConnection' is missing from configuration. " +
                    "Add it to appsettings.json or as an environment variable " +
                    "(ConnectionStrings__DefaultConnection).");

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(
                    connectionString,
                    npgsql =>
                    {
                        // Keep migrations assembly in Infrastructure so the API project
                        // never needs a direct EF Core reference beyond design-time tools.
                        npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);

                        // Automatically retry on transient PostgreSQL failures
                        // (network blips, brief unavailability during deployments).
                        npgsql.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(10),
                            errorCodesToAdd: null);
                    });

                // In development, log the generated SQL and enable sensitive data logging
                // so parameter values appear in query logs for easier debugging.
                // Both are OFF in production (controlled via ASPNETCORE_ENVIRONMENT).
#if DEBUG
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
#endif
            });

            // ------------------------------------------------------------------
            // 2. ASP.NET Core Identity
            // (ApplicationUser and roles stored in the same PostgreSQL database)
            // ------------------------------------------------------------------
            services
                .AddIdentityCore<ApplicationUser>(identityOptions =>
                {
                    // Relax defaults slightly for a staff-only back-office scenario.
                    // Tighten these when exposing a public sign-up flow.
                    identityOptions.Password.RequireDigit = true;
                    identityOptions.Password.RequiredLength = 8;
                    identityOptions.Password.RequireUppercase = false;
                    identityOptions.Password.RequireNonAlphanumeric = false;
                    identityOptions.User.RequireUniqueEmail = true;
                })
                .AddRoles<ApplicationRole>()
                .AddEntityFrameworkStores<AppDbContext>();

            // ------------------------------------------------------------------
            // 3. Future infrastructure registrations (uncomment as implemented)
            // ------------------------------------------------------------------
            // services.AddStackExchangeRedisCache(o =>
            //     o.Configuration = configuration.GetConnectionString("Redis"));
            //
            // services.AddHangfire(o =>
            //     o.UsePostgreSqlStorage(connectionString));
            //
            // services.AddScoped<IOrderRepository, OrderRepository>();
            // services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }
    }
}
