using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Entities;
namespace SipAndStayCafe.Application.Features.Menu.MenuItems;

public sealed class GetMenuItemByIdHandler
    : IRequestHandler<GetMenuItemByIdQuery, MenuItemDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GetMenuItemByIdHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<MenuItemDto> Handle(
     GetMenuItemByIdQuery request, CancellationToken cancellationToken)
    {
        // 4 round-trip yerine tek sorgu
        var item = await _uow.QueryableRepository<MenuItem>()
            .GetByIdWithIncludesAsync(
                request.Id,
                q => q
                    .Include(m => m.Category)
                    .Include(m => m.ModifierGroups.OrderBy(g => g.DisplayOrder))
                        .ThenInclude(g => g.Modifiers.Where(mod => mod.IsActive)
                                                      .OrderBy(mod => mod.DisplayOrder)),
                cancellationToken)
            ?? throw new NotFoundException(nameof(MenuItem), request.Id);

        // Artık ayrı repository çağrısına gerek yok
        var groupDtos = item.ModifierGroups.Select(g =>
        {
            var mods = g.Modifiers
                .Select(m => new ModifierDto(
                    m.Id, m.Name, m.AdditionalPrice, m.DisplayOrder, m.IsActive))
                .ToList();
            return new ModifierGroupDto(
                g.Id, g.Name, g.SelectionType, g.IsRequired, g.DisplayOrder,
                mods.AsReadOnly());
        }).ToList();

        return new MenuItemDto(
            item.Id, item.Name, item.Description, item.BasePrice,
            item.CategoryId, item.Category.Name, item.IsAvailable, item.ImageUrl,
            item.DisplayOrder, groupDtos.AsReadOnly());
    }
}
