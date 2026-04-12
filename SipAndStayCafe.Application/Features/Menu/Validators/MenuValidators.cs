using FluentValidation;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Application.Features.Menu.Validators;

// ── Category ─────────────────────────────────────────────────────────────────

public sealed class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

public sealed class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

// ── MenuItem ──────────────────────────────────────────────────────────────────

public sealed class CreateMenuItemRequestValidator : AbstractValidator<CreateMenuItemRequest>
{
    public CreateMenuItemRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Item name is required.")
            .MaximumLength(200).WithMessage("Item name must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.BasePrice)
            .GreaterThan(0).WithMessage("Base price must be greater than 0.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL must not exceed 500 characters.")
            .When(x => x.ImageUrl is not null);

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

public sealed class UpdateMenuItemRequestValidator : AbstractValidator<UpdateMenuItemRequest>
{
    public UpdateMenuItemRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Item name is required.")
            .MaximumLength(200).WithMessage("Item name must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.BasePrice)
            .GreaterThan(0).WithMessage("Base price must be greater than 0.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL must not exceed 500 characters.")
            .When(x => x.ImageUrl is not null);

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

// ── ModifierGroup ─────────────────────────────────────────────────────────────

public sealed class CreateModifierGroupRequestValidator
    : AbstractValidator<CreateModifierGroupRequest>
{
    public CreateModifierGroupRequestValidator()
    {
        RuleFor(x => x.MenuItemId)
            .NotEmpty().WithMessage("MenuItemId is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Group name is required.")
            .MaximumLength(100).WithMessage("Group name must not exceed 100 characters.");

        RuleFor(x => x.SelectionType)
            .IsInEnum().WithMessage("Invalid selection type.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

public sealed class UpdateModifierGroupRequestValidator
    : AbstractValidator<UpdateModifierGroupRequest>
{
    public UpdateModifierGroupRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Group name is required.")
            .MaximumLength(100).WithMessage("Group name must not exceed 100 characters.");

        RuleFor(x => x.SelectionType)
            .IsInEnum().WithMessage("Invalid selection type.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

// ── Modifier ──────────────────────────────────────────────────────────────────

public sealed class CreateModifierRequestValidator : AbstractValidator<CreateModifierRequest>
{
    public CreateModifierRequestValidator()
    {
        RuleFor(x => x.ModifierGroupId)
            .NotEmpty().WithMessage("ModifierGroupId is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Modifier name is required.")
            .MaximumLength(200).WithMessage("Modifier name must not exceed 200 characters.");

        RuleFor(x => x.AdditionalPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Additional price must be 0 or greater.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}

public sealed class UpdateModifierRequestValidator : AbstractValidator<UpdateModifierRequest>
{
    public UpdateModifierRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Modifier name is required.")
            .MaximumLength(200).WithMessage("Modifier name must not exceed 200 characters.");

        RuleFor(x => x.AdditionalPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Additional price must be 0 or greater.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be 0 or greater.");
    }
}