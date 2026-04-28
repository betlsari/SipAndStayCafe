using AutoMapper;
using SipAndStayCafe.Application.DTOs.Order;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Application.Mappings;

public class OrderMappingProfile : Profile
{
    public OrderMappingProfile()
    {
        // 1. OrderItem -> OrderItemDto Mapping
        CreateMap<OrderItem, OrderItemDto>()
            // Doğrudan Snapshot üzerinden okuyoruz, böylece MenuItem include edilmese bile çalışır
            .ForCtorParam("ProductName", opt => opt.MapFrom(src => src.MenuItemNameSnapshot))
            .ForCtorParam("Quantity", opt => opt.MapFrom(src => src.Quantity))
            .ForCtorParam("ItemTotal", opt => opt.MapFrom(src => src.ItemTotal))
            // Value Object içindeki isimleri string listesine çeviriyoruz
            .ForCtorParam("ModifierSnapshots", opt => opt.MapFrom(src => src.SelectedModifiers.Select(m => m.Name).ToList()));

        // 2. Order -> OrderDto Mapping
        CreateMap<Order, OrderDto>()
            .ForCtorParam("Status", opt => opt.MapFrom(src => src.Status.ToString()))
            .ForCtorParam("CreatedAt", opt => opt.MapFrom(src => src.CreatedAt))
            .ForCtorParam("Note", opt => opt.MapFrom(src => src.Note))
            // Toplam hesabı: Eğer OrderTotal adında Domain metodu varsa o da kullanılabilir. 
            // Biz sağlam olması için alt elemanların (ItemTotal) toplamını alıyoruz.
            .ForCtorParam("Total", opt => opt.MapFrom(src => src.OrderItems.Sum(i => i.ItemTotal)))
            .ForCtorParam("Items", opt => opt.MapFrom(src => src.OrderItems));

        // 3. Order -> OrderSummaryDto Mapping (Liste görünümleri için hafif versiyon)
        CreateMap<Order, OrderSummaryDto>()
            .ForCtorParam("Status", opt => opt.MapFrom(src => src.Status.ToString()))
            .ForCtorParam("Total", opt => opt.MapFrom(src => src.OrderItems.Sum(i => i.ItemTotal)))
            .ForCtorParam("CreatedAt", opt => opt.MapFrom(src => src.CreatedAt));
    }
}