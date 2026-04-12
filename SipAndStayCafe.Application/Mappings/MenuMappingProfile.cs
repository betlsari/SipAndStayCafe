using AutoMapper;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Application.Mappings;

public sealed class MenuMappingProfile : Profile
{
    public MenuMappingProfile()
    {
        // ── Category ──────────────────────────────────────────────────────
        CreateMap<Category, CategoryDto>();

        // ── Modifier ──────────────────────────────────────────────────────
        CreateMap<Modifier, ModifierDto>();

        CreateMap<ModifierGroup, ModifierGroupDto>()
            .ForCtorParam("Modifiers",
                opt => opt.MapFrom(src => src.Modifiers));

        // ── MenuItem ──────────────────────────────────────────────────────
        CreateMap<MenuItem, MenuItemSummaryDto>();

        CreateMap<MenuItem, MenuItemDto>()
            .ForCtorParam("CategoryName",
                opt => opt.MapFrom(src => src.Category.Name))
            .ForCtorParam("ModifierGroups",
                opt => opt.MapFrom(src => src.ModifierGroups));

        // Public menu: Category → MenuCategoryDto (only active + available items)
        // Filtering is done in the query handler before mapping.
        CreateMap<Category, MenuCategoryDto>()
            .ForCtorParam("Items",
                opt => opt.MapFrom(src => src.MenuItems));
    }
}