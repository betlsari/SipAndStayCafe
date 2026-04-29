using FluentValidation;
using SipAndStayCafe.Application.DTOs.Order;

namespace SipAndStayCafe.Application.Features.Orders.Validators;

public sealed class OrderItemRequestValidator : AbstractValidator<OrderItemRequest>
{
    public OrderItemRequestValidator()
    {
        RuleFor(x => x.MenuItemId)
            .NotEmpty()
            .WithMessage("Ürün ID'si boş olamaz.");

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Ürün miktarı en az 1 olmalıdır.");

        RuleFor(x => x.SelectedModifierIds)
            .NotNull()
            .WithMessage("Seçili modifier listesi null olamaz (hiç seçim yoksa boş liste gönderilmelidir).");
    }
}

// Validator'ı PlaceOrderCommand'i alacak şekilde güncelliyoruz
public sealed class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        // Command içindeki Request property'si üzerinden DTO'ya ulaşıyoruz
        RuleFor(x => x.Request.TableNumber)
            .GreaterThan(0)
            .WithMessage("Masa numarası 0'dan büyük geçerli bir değer olmalıdır.");

        RuleFor(x => x.Request.Items)
            .NotEmpty()
            .WithMessage("Sipariş en az bir ürün içermelidir.");

        // Listenin içindeki her bir elemanı OrderItemRequestValidator'a yönlendiriyoruz
        RuleForEach(x => x.Request.Items)
            .SetValidator(new OrderItemRequestValidator());
    }
}