using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.Features.Reports;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.WebAPI.Controllers;

[Route("api/reports")]
[ApiController]
[Authorize(Roles = "Owner")]
public class ReportController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IReportService _reportService;

    public ReportController(IMediator mediator, IReportService reportService)
    {
        _mediator = mediator;
        _reportService = reportService;
    }

    /// <summary>
    /// Belirli bir tarih için günlük satýþ raporunu JSON formatýnda döner.
    /// Örnek: GET /api/reports/daily?date=2026-04-28
    /// </summary>
    /// <param name="date">Rapor alýnacak tarih (yyyy-MM-dd)</param>
    /// <param name="ct">Ýptal token'ý</param>
    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyReport([FromQuery] DateTime date, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDailySalesReportQuery(date), ct);
        return Ok(result);
    }

    /// <summary>
    /// Haftalýk satýþ raporunu JSON formatýnda döner.
    /// Örnek: GET /api/reports/weekly?from=2026-04-21&to=2026-04-28
    /// </summary>
    /// <param name="from">Baþlangýç tarihi (yyyy-MM-dd)</param>
    /// <param name="to">Bitiþ tarihi (yyyy-MM-dd)</param>
    /// <param name="ct">Ýptal token'ý</param>
    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeeklyReport([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetWeeklySalesReportQuery(from, to), ct);
        return Ok(result);
    }

    /// <summary>
    /// Belirli bir zaman diliminde en çok satan ürünleri JSON formatýnda döner.
    /// Örnek: GET /api/reports/top-items?from=2026-04-21&to=2026-04-28&count=10
    /// </summary>
    /// <param name="from">Baþlangýç tarihi (yyyy-MM-dd)</param>
    /// <param name="to">Bitiþ tarihi (yyyy-MM-dd)</param>
    /// <param name="count">Kaç ürün gösterilecek (varsayýlan: 5)</param>
    /// <param name="ct">Ýptal token'ý</param>
    [HttpGet("top-items")]
    public async Task<IActionResult> GetTopItems([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int count = 5, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetTopSellingItemsQuery(from, to, count), ct);
        return Ok(result);
    }

    /// <summary>
    /// Belirli bir zaman diliminde yoðun saatleri (peak hours) JSON formatýnda döner.
    /// Örnek: GET /api/reports/peak-hours?from=2026-04-21&to=2026-04-28
    /// </summary>
    /// <param name="from">Baþlangýç tarihi (yyyy-MM-dd)</param>
    /// <param name="to">Bitiþ tarihi (yyyy-MM-dd)</param>
    /// <param name="ct">Ýptal token'ý</param>
    [HttpGet("peak-hours")]
    public async Task<IActionResult> GetPeakHours([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPeakHoursQuery(from, to), ct);
        return Ok(result);
    }

    /// <summary>
    /// Belirli bir tarih için günlük satýþ raporunu PDF olarak indir.
    /// Örnek: GET /api/reports/daily/pdf?date=2026-04-28
    /// </summary>
    /// <param name="date">Rapor alýnacak tarih (yyyy-MM-dd)</param>
    /// <param name="ct">Ýptal token'ý</param>
    [HttpGet("daily/pdf")]
    public async Task<IActionResult> GetDailyReportPdf([FromQuery] DateTime date, CancellationToken ct)
    {
        var reportData = await _mediator.Send(new GetDailySalesReportQuery(date), ct);
        var pdfBytes = _reportService.GenerateDailyReportPdf(reportData);

        return File(pdfBytes, "application/pdf", $"daily-report-{date:yyyy-MM-dd}.pdf");
    }

    /// <summary>
    /// Haftalýk satýþ raporunu PDF olarak indir.
    /// Örnek: GET /api/reports/weekly/pdf?from=2026-04-21&to=2026-04-28
    /// </summary>
    /// <param name="from">Baþlangýç tarihi (yyyy-MM-dd)</param>
    /// <param name="to">Bitiþ tarihi (yyyy-MM-dd)</param>
    /// <param name="ct">Ýptal token'ý</param>
    [HttpGet("weekly/pdf")]
    public async Task<IActionResult> GetWeeklyReportPdf([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var reportData = await _mediator.Send(new GetWeeklySalesReportQuery(from, to), ct);
        var pdfBytes = _reportService.GenerateWeeklyReportPdf(reportData);

        return File(pdfBytes, "application/pdf", $"weekly-report-{from:yyyy-MM-dd}-to-{to:yyyy-MM-dd}.pdf");
    }
}
