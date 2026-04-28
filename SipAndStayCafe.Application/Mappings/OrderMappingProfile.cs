using AutoMapper;
using SipAndStayCafe.Application.DTOs.Order;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Application.Mappings;

public sealed class OrderMappingProfile : Profile
{
    public OrderMappingProfile()
    {
        CreateMap<OrderItem, OrderItemDto>()
            .ForCtorParam("ProductName",
                opt => opt.MapFrom(src => src.MenuItemNameSnapshot))
            .ForCtorParam("ModifierSnapshots",
                opt => opt.MapFrom(src =>
                    src.SelectedModifiers.Select(m => m.Name).ToList()));

        CreateMap<Order, OrderDto>()
            .ForCtorParam("Status",
                opt => opt.MapFrom(src => src.Status.ToString()))
            .ForCtorParam("Items",
                opt => opt.MapFrom(src => src.OrderItems))
            .ForCtorParam("Total",
                opt => opt.MapFrom(src => src.OrderTotal));
    }
}