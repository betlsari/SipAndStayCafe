using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class ModifierGroupConfiguration : IEntityTypeConfiguration<ModifierGroup>
{
    public void Configure(EntityTypeBuilder<ModifierGroup> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(g => g.SelectionType)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(g => g.IsRequired)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasMany(g => g.Modifiers)
            .WithOne(m => m.ModifierGroup)
            .HasForeignKey(m => m.ModifierGroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
