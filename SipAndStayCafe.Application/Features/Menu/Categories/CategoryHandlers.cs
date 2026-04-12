using AutoMapper;
using MediatR;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Application.Features.Menu.Categories;

// ────────────────────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────────────────────

public sealed record GetAllCategoriesQuery : IRequest<IReadOnlyList<CategoryDto>>;

public sealed class GetAllCategoriesHandler
    : IRequestHandler<GetAllCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GetAllCategoriesHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<CategoryDto>> Handle(
        GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _uow.Repository<Category>()
            .GetAllAsync(cancellationToken);

        return _mapper.Map<IReadOnlyList<CategoryDto>>(
            categories.OrderBy(c => c.DisplayOrder).ToList());
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record GetCategoryByIdQuery(Guid Id) : IRequest<CategoryDto>;

public sealed class GetCategoryByIdHandler
    : IRequestHandler<GetCategoryByIdQuery, CategoryDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public GetCategoryByIdHandler(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<CategoryDto> Handle(
        GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _uow.Repository<Category>()
            .GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.Id);

        return _mapper.Map<CategoryDto>(category);
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Commands
// ────────────────────────────────────────────────────────────────────────────

public sealed record CreateCategoryCommand(CreateCategoryRequest Dto)
    : IRequest<CategoryDto>;

public sealed class CreateCategoryHandler
    : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IMenuCacheService _cache;

    public CreateCategoryHandler(IUnitOfWork uow, IMapper mapper, IMenuCacheService cache)
    {
        _uow = uow;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<CategoryDto> Handle(
        CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = new Category
        {
            Name = request.Dto.Name,
            DisplayOrder = request.Dto.DisplayOrder,
            IsActive = true
        };

        await _uow.Repository<Category>().AddAsync(category, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        return _mapper.Map<CategoryDto>(category);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record UpdateCategoryCommand(Guid Id, UpdateCategoryRequest Dto)
    : IRequest<CategoryDto>;

public sealed class UpdateCategoryHandler
    : IRequestHandler<UpdateCategoryCommand, CategoryDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IMenuCacheService _cache;

    public UpdateCategoryHandler(IUnitOfWork uow, IMapper mapper, IMenuCacheService cache)
    {
        _uow = uow;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<CategoryDto> Handle(
        UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _uow.Repository<Category>()
            .GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.Id);

        category.Name = request.Dto.Name;
        category.DisplayOrder = request.Dto.DisplayOrder;
        category.IsActive = request.Dto.IsActive;

        _uow.Repository<Category>().Update(category);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);

        return _mapper.Map<CategoryDto>(category);
    }
}

// ────────────────────────────────────────────────────────────────────────────

public sealed record DeleteCategoryCommand(Guid Id) : IRequest;

public sealed class DeleteCategoryHandler : IRequestHandler<DeleteCategoryCommand>
{
    private readonly IUnitOfWork _uow;
    private readonly IMenuCacheService _cache;

    public DeleteCategoryHandler(IUnitOfWork uow, IMenuCacheService cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _uow.Repository<Category>()
            .GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.Id);

        _uow.Repository<Category>().Remove(category);
        await _uow.SaveChangesAsync(cancellationToken);
        await _cache.InvalidateMenuAsync(cancellationToken);
    }
}