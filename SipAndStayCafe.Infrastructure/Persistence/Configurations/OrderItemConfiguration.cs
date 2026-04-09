using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Infrastructure.Persistence.Configurations;

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.MenuItemNameSnapshot)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Quantity)
            .IsRequired();

        builder.Property(i => i.ItemTotal)
            .HasColumnType("numeric(10,2)")
            .IsRequired();

        // JSON column — OrderItemModifier value objects stored as JSON array
        builder.OwnsMany(i => i.SelectedModifiers, nav =>
        {
            nav.ToJson();

            nav.Property(m => m.ModifierId).IsRequired();
            nav.Property(m => m.Name).HasMaxLength(200).IsRequired();
            nav.Property(m => m.AdditionalPrice).HasColumnType("numeric(10,2)");
        });

        builder.HasOne(i => i.MenuItem)
            .WithMany()
            .HasForeignKey(i => i.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
