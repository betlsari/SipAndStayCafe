using FluentValidation;
using SipAndStayCafe.Application.Features.Reports;

namespace SipAndStayCafe.Application.Features.Report.Validators;

/// <summary>
/// Günlük satýþ raporu sorgusu için validator.
/// Tarih kontrolleri: future date ve geçerli format kontrolü.
/// </summary>
public sealed class GetDailySalesReportQueryValidator : AbstractValidator<GetDailySalesReportQuery>
{
    public GetDailySalesReportQueryValidator()
    {
        RuleFor(x => x.Date)
            .NotEmpty()
            .WithMessage("Rapor tarihi boþ olamaz.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Gelecek tarihler için rapor oluþturulamaz. Bugün veya daha eski bir tarih seçiniz.");
    }
}

/// <summary>
/// Haftalýk satýþ raporu sorgusu için validator.
/// Tarih kontrolleri: from > to kontrolü, future dates, ve maksimum 90 gün aralýðý.
/// </summary>
public sealed class GetWeeklySalesReportQueryValidator : AbstractValidator<GetWeeklySalesReportQuery>
{
    private const int MaxDateRangeDays = 90;

    public GetWeeklySalesReportQueryValidator()
    {
        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Baþlangýç tarihi boþ olamaz.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Baþlangýç tarihi gelecek tarih olamaz. Bugün veya daha eski bir tarih seçiniz.");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("Bitiþ tarihi boþ olamaz.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Bitiþ tarihi gelecek tarih olamaz. Bugün veya daha eski bir tarih seçiniz.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Bitiþ tarihi baþlangýç tarihinden büyük veya eþit olmalýdýr.");

        RuleFor(x => x.EndDate)
            .Custom((endDate, context) =>
            {
                var request = context.InstanceToValidate;
                var daysDifference = (endDate - request.StartDate).Days;

                if (daysDifference > MaxDateRangeDays)
                {
                    context.AddFailure(
                        nameof(request.EndDate),
                        $"Tarih aralýðý maksimum {MaxDateRangeDays} gün olabilir. Seçilen aralýk {daysDifference} gündür.");
                }
            });
    }
}

/// <summary>
/// En çok satan ürünler sorgusu için validator.
/// Tarih kontrolleri: from > to kontrolü, future dates, maksimum 90 gün, ve count doðrulamasý.
/// </summary>
public sealed class GetTopSellingItemsQueryValidator : AbstractValidator<GetTopSellingItemsQuery>
{
    private const int MaxDateRangeDays = 90;
    private const int MinCount = 1;
    private const int MaxCount = 100;

    public GetTopSellingItemsQueryValidator()
    {
        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Baþlangýç tarihi boþ olamaz.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Baþlangýç tarihi gelecek tarih olamaz. Bugün veya daha eski bir tarih seçiniz.");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("Bitiþ tarihi boþ olamaz.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Bitiþ tarihi gelecek tarih olamaz. Bugün veya daha eski bir tarih seçiniz.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Bitiþ tarihi baþlangýç tarihinden büyük veya eþit olmalýdýr.");

        RuleFor(x => x.EndDate)
            .Custom((endDate, context) =>
            {
                var request = context.InstanceToValidate;
                var daysDifference = (endDate - request.StartDate).Days;

                if (daysDifference > MaxDateRangeDays)
                {
                    context.AddFailure(
                        nameof(request.EndDate),
                        $"Tarih aralýðý maksimum {MaxDateRangeDays} gün olabilir. Seçilen aralýk {daysDifference} gündür.");
                }
            });

        RuleFor(x => x.Count)
            .InclusiveBetween(MinCount, MaxCount)
            .WithMessage($"Gösterilecek ürün sayýsý {MinCount} ile {MaxCount} arasýnda olmalýdýr.");
    }
}

/// <summary>
/// Yoðun saatler (peak hours) sorgusu için validator.
/// Tarih kontrolleri: from > to kontrolü, future dates, ve maksimum 90 gün aralýðý.
/// </summary>
public sealed class GetPeakHoursQueryValidator : AbstractValidator<GetPeakHoursQuery>
{
    private const int MaxDateRangeDays = 90;

    public GetPeakHoursQueryValidator()
    {
        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Baþlangýç tarihi boþ olamaz.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Baþlangýç tarihi gelecek tarih olamaz. Bugün veya daha eski bir tarih seçiniz.");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("Bitiþ tarihi boþ olamaz.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Bitiþ tarihi gelecek tarih olamaz. Bugün veya daha eski bir tarih seçiniz.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Bitiþ tarihi baþlangýç tarihinden büyük veya eþit olmalýdýr.");

        RuleFor(x => x.EndDate)
            .Custom((endDate, context) =>
            {
                var request = context.InstanceToValidate;
                var daysDifference = (endDate - request.StartDate).Days;

                if (daysDifference > MaxDateRangeDays)
                {
                    context.AddFailure(
                        nameof(request.EndDate),
                        $"Tarih aralýðý maksimum {MaxDateRangeDays} gün olabilir. Seçilen aralýk {daysDifference} gündür.");
                }
            });
    }
}
