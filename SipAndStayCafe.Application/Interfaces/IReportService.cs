using SipAndStayCafe.Application.DTOs.Report;

namespace SipAndStayCafe.Application.Interfaces;

public interface IReportService
{
    // Gelen DTO verisini alıp PDF dosyasının byte dizisini (dosya içeriğini) döner
    byte[] GenerateDailyReportPdf(DailySalesReportDto data);
    byte[] GenerateWeeklyReportPdf(WeeklySalesReportDto data);
}