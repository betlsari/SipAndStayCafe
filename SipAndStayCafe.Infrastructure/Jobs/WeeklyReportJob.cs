using Microsoft.Extensions.Logging;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Jobs;

/// <summary>
/// Her Pazartesi gece yarısı çalışır; geçen haftanın satış raporunu PDF olarak üretir.
/// Üretilen PDF şimdilik loglara yazılır — ileride e-posta / admin panel ekine taşınabilir.
/// </summary>
public sealed class WeeklyReportJob
{
    private readonly IReportService _reportService;
    private readonly ILogger<WeeklyReportJob> _logger;

    public WeeklyReportJob(IReportService reportService, ILogger<WeeklyReportJob> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        // Geçen Pazartesi — Pazar aralığı
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var lastMonday = today.AddDays(-(int)today.DayOfWeek - 6);  // ISO: Pazartesi = 1
        var lastSunday = lastMonday.AddDays(6);

        _logger.LogInformation(
            "[WeeklyReportJob] Rapor üretiliyor: {From} – {To}", lastMonday, lastSunday);

        try
        {
            var pdf = await _reportService.GenerateWeeklySalesReportAsync(
                lastMonday, lastSunday, cancellationToken);

            // TODO: PDF'i e-posta ile gönder veya admin panel üzerinden indirilebilir yap.
            // Şimdilik boyutu logla.
            _logger.LogInformation(
                "[WeeklyReportJob] PDF üretildi. Boyut: {Bytes} byte", pdf.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[WeeklyReportJob] Rapor üretilemedi.");
            throw;  // Hangfire başarısız sayar ve yeniden dener
        }
    }
}