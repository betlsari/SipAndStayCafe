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
        // Formül Düzeltmesi: Eğer Job Pazartesi çalışıyorsa, "EndDate" Dün (Pazar) olmalıdır.
        // StartDate ise ondan 6 gün öncesi (Önceki Pazartesi) olmalıdır.
        var today = DateTime.Today;

        var endDate = today.AddDays(-1);
        var startDate = endDate.AddDays(-6);

        _logger.LogInformation("Haftalık rapor tetiklendi. Dönem: {Start} - {End}", startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd"));

        // 1. Veriyi çek (Önceki adımda yazdığımız Handler tetiklenir)
        var query = new GetWeeklySalesReportQuery(startDate, endDate);
        var reportData = await _mediator.Send(query, ct);

        // 2. PDF Dosyasını üret (Byte Array olarak)
        var pdfBytes = _reportService.GenerateWeeklyReportPdf(reportData);

        // TODO (İleriye dönük): Bu noktada üretilen 'pdfBytes' dizisi IEmailService üzerinden
        // işletme sahibinin mailine gönderilebilir veya bir Cloud Storage'a kaydedilebilir.

        _logger.LogInformation("Haftalık PDF raporu başarıyla oluşturuldu. Dosya Boyutu: {Size} KB", pdfBytes.Length / 1024);
    }
}