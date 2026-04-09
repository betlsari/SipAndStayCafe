using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;
using Hangfire.Dashboard;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SipAndStayCafe.Domain.Common;
using StackExchange.Redis;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SipAndStayCafe.Infrastructure.Persistence;

/// <summary>
/// The central EF Core database context for CafeOrder.
/// Inherits from <see cref="IdentityDbContext"/> so that
/// ASP.NET Core Identity tables (users, roles, claims, etc.)
/// are co-located in the same PostgreSQL database.
/// </summary>
/// <remarks>
/// <para>
/// <b>Audit stamps:</b> <see cref="CreatedAt"/> and <see cref="UpdatedAt"/> are
/// set automatically in <see cref="SaveChangesAsync"/> by inspecting
/// <see cref="Microsoft.EntityFrameworkCore.ChangeTracking.ChangeTracker"/> entries —
/// domain code never needs to touch these fields.
/// </para>
/// <para>
/// <b>Configuration:</b> Each entity's column mappings, constraints, indexes, and
/// relationships are defined in dedicated <c>IEntityTypeConfiguration&lt;T&gt;</c>
/// classes inside <c>Infrastructure/Persistence/Configurations/</c>.
/// <c>OnModelCreating</c> auto-discovers them with <c>ApplyConfigurationsFromAssembly</c>
/// so this file stays clean as the model grows.
/// </para>
/// </remarks>
public sealed class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    // -----------------------------------------------------------------------
    // Domain DbSets
    // -----------------------------------------------------------------------

    /// <summary>Physical tables inside the cafe, each linked to a unique QR code.</summary>
    public DbSet<Table> Tables => Set<Table>();

    /// <summary>Items available on the menu, grouped by category.</summary>
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    /// <summary>Groups of modifiers attached to a menu item (e.g. "Milk Type", "Extra Toppings").</summary>
    public DbSet<ModifierGroup> ModifierGroups => Set<ModifierGroup>();

    /// <summary>Individual modifier options inside a group (e.g. "Oat Milk", "Extra Avocado").</summary>
    public DbSet<Modifier> Modifiers => Set<Modifier>();

    /// <summary>Customer orders submitted from a table, containing one or more order items.</summary>
    public DbSet<Order> Orders => Set<Order>();

    /// <summary>A single line in an order, referencing a menu item and its selected modifiers.</summary>
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    /// <summary>
    /// A table session tracks all orders placed at a table between the first order
    /// and payment. Holds payment method locking and payment status.
    /// </summary>
    public DbSet<TableSession> TableSessions => Set<TableSession>();

    /// <summary>
    /// Each online payment attempt (including failures) is recorded here
    /// for audit trail and İyzico reconciliation.
    /// </summary>
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    /// <summary>Daily availability flag updates for menu items, recorded per date.</summary>
    public DbSet<StockUpdate> StockUpdates => Set<StockUpdate>();

    // -----------------------------------------------------------------------
    // Model configuration
    // -----------------------------------------------------------------------

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Identity base configuration (users, roles, claims, logins, tokens)
        base.OnModelCreating(builder);

        // Auto-discover all IEntityTypeConfiguration<T> classes in this assembly.
        // Add a Configurations/ folder and implement one class per entity —
        // this method will pick them all up without any changes here.
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Global convention: map all DateTime properties to UTC timestamp columns.
        // This prevents Npgsql's "timestamp with time zone" mismatch warnings.
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties()
                         .Where(p => p.ClrType == typeof(DateTime) || p.ClrType == typeof(DateTime?)))
            {
                property.SetColumnType("timestamp with time zone");
            }
        }
    }

    // -----------------------------------------------------------------------
    // Audit stamp automation
    // -----------------------------------------------------------------------

    /// <inheritdoc/>
    public override async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        ApplyAuditStamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public override int SaveChanges()
    {
        ApplyAuditStamps();
        return base.SaveChanges();
    }

    /// <summary>
    /// Iterates over all tracked <see cref="BaseEntity"/> entries and stamps
    /// <see cref="BaseEntity.CreatedAt"/> (on insert) and
    /// <see cref="BaseEntity.UpdatedAt"/> (on insert and update) with the
    /// current UTC time.
    /// </summary>
    private void ApplyAuditStamps()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;

                case EntityState.Modified:
                    // Never overwrite CreatedAt on an update.
                    entry.Property(e => e.CreatedAt).IsModified = false;
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }
    }
}