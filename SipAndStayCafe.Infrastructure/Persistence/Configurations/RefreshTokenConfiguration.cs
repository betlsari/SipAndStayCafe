using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.UserId)
            .IsRequired()
            .HasMaxLength(450); // Identity default key length

        builder.Property(r => r.TokenHash)
            .IsRequired()
            .HasMaxLength(64); // SHA-256 hex = 64 chars

        builder.Property(r => r.ExpiresAt)
            .IsRequired();

        builder.Property(r => r.DeviceHint)
            .HasMaxLength(200);

        // Fast lookup by hash (the most common query pattern on refresh)
        builder.HasIndex(r => r.TokenHash)
            .IsUnique();

        // Index for "get all active tokens for user" (logout all devices scenario)
        builder.HasIndex(r => r.UserId);
    }
}