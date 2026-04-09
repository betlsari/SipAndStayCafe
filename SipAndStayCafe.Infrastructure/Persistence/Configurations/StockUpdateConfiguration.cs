using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class StockUpdateConfiguration : IEntityTypeConfiguration<StockUpdate>
{
    public void Configure(EntityTypeBuilder<StockUpdate> builder)
    {
        builder.HasKey(s => s.Id);

        // Composite unique index: bir ürün için günde yalnızca bir kayıt olabilir
        builder.HasIndex(s => new { s.MenuItemId, s.Date })
            .IsUnique();

        builder.Property(s => s.Date)
            .IsRequired();

        builder.Property(s => s.IsAvailable)
            .IsRequired();

        builder.Property(s => s.Note)
            .HasMaxLength(500);
    }
}
