using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class TableConfiguration : IEntityTypeConfiguration<Table>
{
    public void Configure(EntityTypeBuilder<Table> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TableNumber)
            .IsRequired();

        builder.HasIndex(t => t.TableNumber)
            .IsUnique();

        builder.Property(t => t.QRCodeUrl)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(t => t.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasMany(t => t.Sessions)
            .WithOne(s => s.Table)
            .HasForeignKey(s => s.TableId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
