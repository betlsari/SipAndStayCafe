using AutoMapper;
using MediatR;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Application.Features.Menu.Modifiers;

// ────────────────────────────────────────────────────────────────────────────
// ModifierGroup
// ────────────────────────────────────────────────────────────────────────────

public sealed record CreateModifierGroupCommand(CreateModifierGroupRequest Dto)
    : IRequest<ModifierGroupDto>;

public sealed class CreateModifierGroupHandler
    : IRequestHandler<CreateModifierGroupCommand, ModifierGroupDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public CreateModifierGroupHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task<ModifierGroupDto> Handle(
        CreateModifierGroupCommand request, CancellationToken cancellationToken)
    {
        _ = await _uow.Repository<MenuItem>()
            .GetByIdAsync(request.Dto.MenuItemId, cancellationToken)
            ?? throw new NotFoundException(nameof(MenuItem), request.Dto.MenuItemId);

        var group = new ModifierGroup
        {
            MenuItemId = request.Dto.MenuItemId,
            Name = request.Dto.Name,
            SelectionType = request.Dto.SelectionType,
            IsRequired = request.Dto.IsRequired,
            DisplayOrder = request.Dto.DisplayOrder
        };

        await _uow.Repository<ModifierGroup>().AddAsync(group, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        return new ModifierGroupDto(
            group.Id, group.Name, group.SelectionType, group.IsRequired,
            group.DisplayOrder, []);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record UpdateModifierGroupCommand(Guid Id, UpdateModifierGroupRequest Dto)
    : IRequest<ModifierGroupDto>;

public sealed class UpdateModifierGroupHandler
    : IRequestHandler<UpdateModifierGroupCommand, ModifierGroupDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public UpdateModifierGroupHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task<ModifierGroupDto> Handle(
        UpdateModifierGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _uow.Repository<ModifierGroup>()
            .GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(ModifierGroup), request.Id);

        group.Name = request.Dto.Name;
        group.SelectionType = request.Dto.SelectionType;
        group.IsRequired = request.Dto.IsRequired;
        group.DisplayOrder = request.Dto.DisplayOrder;

        _uow.Repository<ModifierGroup>().Update(group);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        // Re-fetch modifiers for the response
        var modifiers = await _uow.Repository<Modifier>()
            .FindAsync(m => m.ModifierGroupId == group.Id && m.IsActive, cancellationToken);

        var modDtos = modifiers
            .OrderBy(m => m.DisplayOrder)
            .Select(m => new ModifierDto(m.Id, m.Name, m.AdditionalPrice, m.DisplayOrder, m.IsActive))
            .ToList()
            .AsReadOnly();

        return new ModifierGroupDto(
            group.Id, group.Name, group.SelectionType, group.IsRequired,
            group.DisplayOrder, modDtos);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record DeleteModifierGroupCommand(Guid Id) : IRequest;

public sealed class DeleteModifierGroupHandler : IRequestHandler<DeleteModifierGroupCommand>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public DeleteModifierGroupHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task Handle(DeleteModifierGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _uow.Repository<ModifierGroup>()
            .GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(ModifierGroup), request.Id);

        _uow.Repository<ModifierGroup>().Remove(group);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Modifier
// ────────────────────────────────────────────────────────────────────────────

public sealed record CreateModifierCommand(CreateModifierRequest Dto)
    : IRequest<ModifierDto>;

public sealed class CreateModifierHandler : IRequestHandler<CreateModifierCommand, ModifierDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public CreateModifierHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task<ModifierDto> Handle(
        CreateModifierCommand request, CancellationToken cancellationToken)
    {
        _ = await _uow.Repository<ModifierGroup>()
            .GetByIdAsync(request.Dto.ModifierGroupId, cancellationToken)
            ?? throw new NotFoundException(nameof(ModifierGroup), request.Dto.ModifierGroupId);

        var modifier = new Modifier
        {
            ModifierGroupId = request.Dto.ModifierGroupId,
            Name = request.Dto.Name,
            AdditionalPrice = request.Dto.AdditionalPrice,
            DisplayOrder = request.Dto.DisplayOrder,
            IsActive = true
        };

        await _uow.Repository<Modifier>().AddAsync(modifier, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        return new ModifierDto(
            modifier.Id, modifier.Name, modifier.AdditionalPrice,
            modifier.DisplayOrder, modifier.IsActive);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record UpdateModifierCommand(Guid Id, UpdateModifierRequest Dto)
    : IRequest<ModifierDto>;

public sealed class UpdateModifierHandler : IRequestHandler<UpdateModifierCommand, ModifierDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public UpdateModifierHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task<ModifierDto> Handle(
        UpdateModifierCommand request, CancellationToken cancellationToken)
    {
        var modifier = await _uow.Repository<Modifier>()
            .GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Modifier), request.Id);

        modifier.Name = request.Dto.Name;
        modifier.AdditionalPrice = request.Dto.AdditionalPrice;
        modifier.DisplayOrder = request.Dto.DisplayOrder;
        modifier.IsActive = request.Dto.IsActive;

        _uow.Repository<Modifier>().Update(modifier);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        return new ModifierDto(
            modifier.Id, modifier.Name, modifier.AdditionalPrice,
            modifier.DisplayOrder, modifier.IsActive);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record DeleteModifierCommand(Guid Id) : IRequest;

public sealed class DeleteModifierHandler : IRequestHandler<DeleteModifierCommand>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public DeleteModifierHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task Handle(DeleteModifierCommand request, CancellationToken cancellationToken)
    {
        var modifier = await _uow.Repository<Modifier>()
            .GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Modifier), request.Id);

        _uow.Repository<Modifier>().Remove(modifier);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);
    }
}