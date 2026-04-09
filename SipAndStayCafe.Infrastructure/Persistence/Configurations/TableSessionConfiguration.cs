using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class TableSessionConfiguration : IEntityTypeConfiguration<TableSession>
{
    public void Configure(EntityTypeBuilder<TableSession> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.OpenedAt)
            .IsRequired();

        builder.Property(s => s.TotalAmount)
            .HasColumnType("numeric(10,2)")
            .IsRequired();

        builder.Property(s => s.IsPaid)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.PaymentMethod)
            .IsRequired()
            .HasDefaultValue(PaymentMethod.None)
            .HasConversion<int>();

        builder.Property(s => s.PaymentStatus)
            .IsRequired()
            .HasDefaultValue(PaymentStatus.None)
            .HasConversion<int>();

        builder.HasMany(s => s.Orders)
            .WithOne(o => o.TableSession)
            .HasForeignKey(o => o.TableSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.PaymentTransactions)
            .WithOne(pt => pt.TableSession)
            .HasForeignKey(pt => pt.TableSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
