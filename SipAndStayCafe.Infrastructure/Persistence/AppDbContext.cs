// AppDbContext.cs — ADD this DbSet alongside the existing ones.
// Location: SipAndStayCafe.Infrastructure/Persistence/AppDbContext.cs
//
// CHANGE: Add the following line inside the "Domain DbSets" region,
// after the existing StockUpdates DbSet:

// public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

// The RefreshTokenConfiguration class (in Configurations/) is auto-discovered
// by ApplyConfigurationsFromAssembly — no further changes needed in OnModelCreating.

// ─────────────────────────────────────────────────────────────────────────────
// FULL UPDATED FILE (replace your existing AppDbContext.cs with this):
// ─────────────────────────────────────────────────────────────────────────────

using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace SipAndStayCafe.Infrastructure.Persistence;

public sealed class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    // -----------------------------------------------------------------------
    // Domain DbSets
    // -----------------------------------------------------------------------
    public DbSet<Domain.Entities.Table> Tables => Set<Domain.Entities.Table>();
    public DbSet<Domain.Entities.MenuItem> MenuItems => Set<Domain.Entities.MenuItem>();
    public DbSet<ModifierGroup> ModifierGroups => Set<ModifierGroup>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Modifier> Modifiers => Set<Modifier>();
    public DbSet<Domain.Entities.Order> Orders => Set<Domain.Entities.Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<TableSession> TableSessions => Set<TableSession>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<StockUpdate> StockUpdates => Set<StockUpdate>();

    /// <summary>Persisted refresh tokens for staff users. Raw token is never stored — only its SHA-256 hash.</summary>
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // -----------------------------------------------------------------------
    // Model configuration
    // -----------------------------------------------------------------------
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Auto-discover all IEntityTypeConfiguration<T> classes in this assembly
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // OrderItemModifier stored as JSON column inside OrderItem
        builder.Entity<OrderItem>().OwnsMany(o => o.SelectedModifiers, b => b.ToJson());

        // Global convention: UTC timestamps
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
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditStamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditStamps();
        return base.SaveChanges();
    }

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
                    entry.Property(e => e.CreatedAt).IsModified = false;
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }
    }
}