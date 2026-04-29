using MediatR;
using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.Features.Reports;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Jobs;

public class WeeklyReportJob
{
    private readonly IMediator _mediator;
    private readonly IReportService _reportService;
    private readonly ILogger<WeeklyReportJob> _logger;

    public WeeklyReportJob(IMediator mediator, IReportService reportService, ILogger<WeeklyReportJob> logger)
    {
        _mediator = mediator;
        _reportService = reportService;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct)
    {
        var today = DateTime.Today;
        var endDate = today.AddDays(-1);
        var startDate = endDate.AddDays(-6);

        _logger.LogInformation("Haftalık rapor tetiklendi. Dönem: {Start} - {End}",
            startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd"));

        var query = new GetWeeklySalesReportQuery(startDate, endDate);
        var reportData = await _mediator.Send(query, ct);

        var pdfBytes = _reportService.GenerateWeeklyReportPdf(reportData);

        // Kaydetme klasörü
        var reportsDir = Path.Combine(AppContext.BaseDirectory, "Reports");
        Directory.CreateDirectory(reportsDir);

        var fileName = $"weekly-report-{startDate:yyyy-MM-dd}_{endDate:yyyy-MM-dd}.pdf";
        var filePath = Path.Combine(reportsDir, fileName);

        await File.WriteAllBytesAsync(filePath, pdfBytes, ct);

        _logger.LogInformation(
            "Haftalık PDF raporu kaydedildi: {FilePath} ({Size} KB)",
            filePath, pdfBytes.Length / 1024);
    }
}