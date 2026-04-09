using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Provider)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(p => p.ProviderPaymentId)
            .HasMaxLength(200);

        builder.Property(p => p.Amount)
            .HasColumnType("numeric(10,2)")
            .IsRequired();

        builder.Property(p => p.Status)
            .IsRequired()
            .HasDefaultValue(PaymentStatus.Pending)
            .HasConversion<int>();

        builder.Property(p => p.FailureReason)
            .HasMaxLength(1000);
    }
}
