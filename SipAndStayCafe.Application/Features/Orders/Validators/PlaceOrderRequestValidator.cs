using FluentValidation;
using SipAndStayCafe.Application.DTOs.Order;

namespace SipAndStayCafe.Application.Features.Orders.Validators;

// 1. Her bir sipariş satırı (OrderItem) için Validator
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

// 2. Ana sipariş isteği (PlaceOrder) için Validator
public sealed class PlaceOrderRequestValidator : AbstractValidator<PlaceOrderRequest>
{
    public PlaceOrderRequestValidator()
    {
        RuleFor(x => x.TableNumber)
            .GreaterThan(0)
            .WithMessage("Masa numarası 0'dan büyük geçerli bir değer olmalıdır.");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Sipariş en az bir ürün içermelidir.");

        // Listenin içindeki her bir elemanı (OrderItemRequest) yukarıdaki validator'a yönlendiriyoruz
        RuleForEach(x => x.Items)
            .SetValidator(new OrderItemRequestValidator());
    }
}