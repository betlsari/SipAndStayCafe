using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.Features.Reports;
using SipAndStayCafe.Application.Interfaces;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Owner")]
public sealed class ReportController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IReportService _reportService;

    public ReportController(IMediator mediator, IReportService reportService)
    {
        _mediator = mediator;
        _reportService = reportService;
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyReport([FromQuery] DateTime date, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDailySalesReportQuery(date), ct);
        return Ok(result);
    }

    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeeklyReport(
        [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetWeeklySalesReportQuery(startDate, endDate), ct);
        return Ok(result);
    }

    [HttpGet("top-selling")]
    public async Task<IActionResult> GetTopSelling(
        [FromQuery] DateTime startDate, [FromQuery] DateTime endDate,
        [FromQuery] int count = 5, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetTopSellingItemsQuery(startDate, endDate, count), ct);
        return Ok(result);
    }

    [HttpGet("peak-hours")]
    public async Task<IActionResult> GetPeakHours(
        [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPeakHoursQuery(startDate, endDate), ct);
        return Ok(result);
    }

    [HttpGet("daily/pdf")]
    public async Task<IActionResult> GetDailyReportPdf([FromQuery] DateTime date, CancellationToken ct)
    {
        var data = await _mediator.Send(new GetDailySalesReportQuery(date), ct);
        var pdf = _reportService.GenerateDailyReportPdf(data);
        return File(pdf, "application/pdf", $"daily-report-{date:yyyy-MM-dd}.pdf");
    }

    [HttpGet("weekly/pdf")]
    public async Task<IActionResult> GetWeeklyReportPdf(
        [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, CancellationToken ct)
    {
        var data = await _mediator.Send(new GetWeeklySalesReportQuery(startDate, endDate), ct);
        var pdf = _reportService.GenerateWeeklyReportPdf(data);
        return File(pdf, "application/pdf", $"weekly-report-{startDate:yyyy-MM-dd}.pdf");
    }
}