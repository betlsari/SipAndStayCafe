using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(m => m.Description)
            .HasMaxLength(1000);

        builder.Property(m => m.BasePrice)
            .HasColumnType("numeric(10,2)")
            .IsRequired();

        builder.Property(m => m.IsAvailable)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(m => m.ImageUrl)
            .HasMaxLength(500);

        // PostgreSQL xmin system column — her UPDATE'de otomatik artar
        builder.Property(m => m.RowVersion)
            .HasColumnName("xmin")
            .HasColumnType("xid")
            .ValueGeneratedOnAddOrUpdate()
            .IsConcurrencyToken();

        builder.HasMany(m => m.ModifierGroups)
            .WithOne(g => g.MenuItem)
            .HasForeignKey(g => g.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(m => m.StockUpdates)
            .WithOne(s => s.MenuItem)
            .HasForeignKey(s => s.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        
    }
}
