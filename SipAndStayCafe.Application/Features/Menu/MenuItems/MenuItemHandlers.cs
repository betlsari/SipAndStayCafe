using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;
namespace SipAndStayCafe.Application.Features.Menu.MenuItems;

// ────────────────────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Returns the full public menu: active categories → available items → modifier groups.
/// Tries Redis cache first; falls back to DB on cache miss and re-populates the cache.
/// </summary>
public sealed record GetPublicMenuQuery : IRequest<IReadOnlyList<MenuCategoryDto>>;

public sealed class GetPublicMenuHandler
    : IRequestHandler<GetPublicMenuQuery, IReadOnlyList<MenuCategoryDto>>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IMenuCacheService _cache;

    public GetPublicMenuHandler(IUnitOfWork uow, IMapper mapper, IMenuCacheService cache)
    {
        _uow = uow;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<IReadOnlyList<MenuCategoryDto>> Handle(
        GetPublicMenuQuery request, CancellationToken cancellationToken)
    {
        var cached = await _cache.GetPublicMenuAsync(cancellationToken);
        if (cached is not null) return cached;

        var categories = await _uow.Repository<Category>()
            .FindAsync(c => c.IsActive, cancellationToken);

        var menuItems = await _uow.Repository<MenuItem>()
            .FindAsync(m => m.IsAvailable, cancellationToken);

        var modifierGroups = await _uow.Repository<ModifierGroup>()
            .GetAllAsync(cancellationToken);

        var modifiers = await _uow.Repository<Modifier>()
            .FindAsync(m => m.IsActive, cancellationToken);

        var modifiersByGroup = modifiers
            .GroupBy(m => m.ModifierGroupId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var groupsByItem = modifierGroups
            .GroupBy(g => g.MenuItemId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = categories
            .OrderBy(c => c.DisplayOrder)
            .Select(cat =>
            {
                var items = menuItems
                    .Where(i => i.CategoryId == cat.Id)
                    .OrderBy(i => i.DisplayOrder)
                    .Select(item =>
                    {
                        var groups = groupsByItem.GetValueOrDefault(item.Id, [])
                            .OrderBy(g => g.DisplayOrder)
                            .Select(g =>
                            {
                                var mods = modifiersByGroup.GetValueOrDefault(g.Id, [])
                                    .OrderBy(m => m.DisplayOrder)
                                    .Select(m => new ModifierDto(
                                        m.Id, m.Name, m.AdditionalPrice, m.DisplayOrder, m.IsActive))
                                    .ToList();

                                return new ModifierGroupDto(
                                    g.Id, g.Name, g.SelectionType, g.IsRequired, g.DisplayOrder,
                                    mods.AsReadOnly());
                            })
                            .ToList();

                        return new MenuItemDto(
                            item.Id, item.Name, item.Description, item.BasePrice,
                            item.CategoryId, cat.Name, item.IsAvailable, item.ImageUrl,
                            item.DisplayOrder, groups.AsReadOnly());
                    })
                    .ToList();

                return new MenuCategoryDto(cat.Id, cat.Name, cat.DisplayOrder,
                    items.AsReadOnly());
            })
            .Where(c => c.Items.Count > 0)
            .ToList()
            .AsReadOnly();

        await _cache.SetPublicMenuAsync(result, cancellationToken);
        return result;
    }
}

// ────────────────────────────────────────────────────────────────────────────

/// <summary>Admin: all items (including unavailable), with category + modifier groups.</summary>
public sealed record GetAllMenuItemsQuery : IRequest<IReadOnlyList<MenuItemSummaryDto>>;

public sealed class GetAllMenuItemsHandler
    : IRequestHandler<GetAllMenuItemsQuery, IReadOnlyList<MenuItemSummaryDto>>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GetAllMenuItemsHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<MenuItemSummaryDto>> Handle(
        GetAllMenuItemsQuery request, CancellationToken cancellationToken)
    {
        var items = await _uow.Repository<MenuItem>().GetAllAsync(cancellationToken);
        return _mapper.Map<IReadOnlyList<MenuItemSummaryDto>>(
            items.OrderBy(i => i.DisplayOrder).ToList());
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record GetMenuItemByIdQuery(Guid Id) : IRequest<MenuItemDto>;

// ────────────────────────────────────────────────────────────────────────────
// Commands
// ────────────────────────────────────────────────────────────────────────────

public sealed record CreateMenuItemCommand(CreateMenuItemRequest Dto) : IRequest<MenuItemDto>;

public sealed class CreateMenuItemHandler : IRequestHandler<CreateMenuItemCommand, MenuItemDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IMenuCacheService _cache;

    public CreateMenuItemHandler(IUnitOfWork uow, IMapper mapper, IMenuCacheService cache)
    {
        _uow = uow;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<MenuItemDto> Handle(
        CreateMenuItemCommand request, CancellationToken cancellationToken)
    {
        var category = await _uow.Repository<Category>()
            .GetByIdAsync(request.Dto.CategoryId, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.Dto.CategoryId);

        var item = new MenuItem
        {
            Name = request.Dto.Name,
            Description = request.Dto.Description,
            BasePrice = request.Dto.BasePrice,
            CategoryId = request.Dto.CategoryId,
            ImageUrl = request.Dto.ImageUrl,
            DisplayOrder = request.Dto.DisplayOrder,
            IsAvailable = true
        };

        await _uow.Repository<MenuItem>().AddAsync(item, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        return new MenuItemDto(
            item.Id, item.Name, item.Description, item.BasePrice,
            item.CategoryId, category.Name, item.IsAvailable, item.ImageUrl,
            item.DisplayOrder, []);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record UpdateMenuItemCommand(Guid Id, UpdateMenuItemRequest Dto)
    : IRequest<MenuItemSummaryDto>;

public sealed class UpdateMenuItemHandler
    : IRequestHandler<UpdateMenuItemCommand, MenuItemSummaryDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IMenuCacheService _cache;

    public UpdateMenuItemHandler(IUnitOfWork uow, IMapper mapper, IMenuCacheService cache)
    {
        _uow = uow;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<MenuItemSummaryDto> Handle(
        UpdateMenuItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _uow.Repository<MenuItem>().GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(MenuItem), request.Id);

        _ = await _uow.Repository<Category>().GetByIdAsync(request.Dto.CategoryId, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.Dto.CategoryId);

        item.Name = request.Dto.Name;
        item.Description = request.Dto.Description;
        item.BasePrice = request.Dto.BasePrice;
        item.CategoryId = request.Dto.CategoryId;
        item.IsAvailable = request.Dto.IsAvailable;
        item.ImageUrl = request.Dto.ImageUrl;
        item.DisplayOrder = request.Dto.DisplayOrder;

        _uow.Repository<MenuItem>().Update(item);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        return _mapper.Map<MenuItemSummaryDto>(item);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record DeleteMenuItemCommand(Guid Id) : IRequest;

public sealed class DeleteMenuItemHandler : IRequestHandler<DeleteMenuItemCommand>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public DeleteMenuItemHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task Handle(DeleteMenuItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _uow.Repository<MenuItem>().GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(MenuItem), request.Id);

        _uow.Repository<MenuItem>().Remove(item);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Stock update (today's availability)
// ────────────────────────────────────────────────────────────────────────────

public sealed record UpdateStockCommand(Guid MenuItemId, UpdateStockRequest Dto)
    : IRequest<Result<bool>>;

public sealed class UpdateStockHandler : IRequestHandler<UpdateStockCommand, Result<bool>>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public UpdateStockHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task<Result<bool>> Handle(
        UpdateStockCommand request,
        CancellationToken cancellationToken)
    {
        var item = await _uow.Repository<MenuItem>()
            .GetByIdAsync(request.MenuItemId, cancellationToken)
            ?? throw new NotFoundException(nameof(MenuItem), request.MenuItemId);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var existing = await _uow.Repository<StockUpdate>()
            .FirstOrDefaultAsync(
                s => s.MenuItemId == request.MenuItemId && s.Date == today,
                cancellationToken);

        if (existing is null)
        {
            var stockUpdate = new StockUpdate
            {
                MenuItemId = request.MenuItemId,
                Date = today,
                IsAvailable = request.Dto.IsAvailable,
                Note = request.Dto.Note
            };
            await _uow.Repository<StockUpdate>().AddAsync(stockUpdate, cancellationToken);
        }
        else
        {
            existing.IsAvailable = request.Dto.IsAvailable;
            existing.Note = request.Dto.Note;
            _uow.Repository<StockUpdate>().Update(existing);
        }

        item.IsAvailable = request.Dto.IsAvailable;
        _uow.Repository<MenuItem>().Update(item);

        try
        {
            await _uow.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Failure<bool>(
                Error.General.Conflict("MenuItem was modified by another request. Please retry."));
        }
        await _cache.InvalidateMenuAsync(cancellationToken);

        return Result.Success(true);
    }
}