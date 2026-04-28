using MediatR;
using SipAndStayCafe.Application.DTOs.Report;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Application.Features.Reports;

// ==========================================
// 1. QUERIES
// ==========================================

public record GetDailySalesReportQuery(DateTime Date) : IRequest<DailySalesReportDto>;

public record GetWeeklySalesReportQuery(DateTime StartDate, DateTime EndDate) : IRequest<WeeklySalesReportDto>;

public record GetTopSellingItemsQuery(DateTime StartDate, DateTime EndDate, int Count = 5) : IRequest<List<TopSellingItemDto>>;

public record GetPeakHoursQuery(DateTime StartDate, DateTime EndDate) : IRequest<List<HourlySalesDto>>;

// ==========================================
// 2. HANDLERS
// ==========================================

public class GetDailySalesReportHandler : IRequestHandler<GetDailySalesReportQuery, DailySalesReportDto>
{
    private readonly IReportRepository _reportRepository;

    public GetDailySalesReportHandler(IReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<DailySalesReportDto> Handle(GetDailySalesReportQuery request, CancellationToken cancellationToken)
    {
        return await _reportRepository.GetDailySalesReportAsync(request.Date, cancellationToken);
    }
}

public class GetWeeklySalesReportHandler : IRequestHandler<GetWeeklySalesReportQuery, WeeklySalesReportDto>
{
    private readonly IReportRepository _reportRepository;

    public GetWeeklySalesReportHandler(IReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<WeeklySalesReportDto> Handle(GetWeeklySalesReportQuery request, CancellationToken cancellationToken)
    {
        // Güvenlik kuralı: Bitiş tarihi başlangıçtan küçük olamaz
        if (request.EndDate < request.StartDate)
            throw new ArgumentException("Bitiş tarihi başlangıç tarihinden küçük olamaz.");

        return await _reportRepository.GetWeeklySalesReportAsync(request.StartDate, request.EndDate, cancellationToken);
    }
}

public class GetTopSellingItemsHandler : IRequestHandler<GetTopSellingItemsQuery, List<TopSellingItemDto>>
{
    private readonly IReportRepository _reportRepository;

    public GetTopSellingItemsHandler(IReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<List<TopSellingItemDto>> Handle(GetTopSellingItemsQuery request, CancellationToken cancellationToken)
    {
        return await _reportRepository.GetTopSellingItemsAsync(request.StartDate, request.EndDate, request.Count, cancellationToken);
    }
}

public class GetPeakHoursHandler : IRequestHandler<GetPeakHoursQuery, List<HourlySalesDto>>
{
    private readonly IReportRepository _reportRepository;

    public GetPeakHoursHandler(IReportRepository reportRepository)
    {
        _reportRepository = reportRepository;
    }

    public async Task<List<HourlySalesDto>> Handle(GetPeakHoursQuery request, CancellationToken cancellationToken)
    {
        return await _reportRepository.GetPeakHoursAsync(request.StartDate, request.EndDate, cancellationToken);
    }
}