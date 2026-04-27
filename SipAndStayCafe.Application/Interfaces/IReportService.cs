namespace SipAndStayCafe.Application.Interfaces;

public interface IReportService
{
    /// <summary>
    /// Belirtilen tarih aralığı için satış raporunu PDF olarak üretir.
    /// Dönen byte[] doğrudan dosyaya yazılabilir veya e-posta ekine eklenebilir.
    /// </summary>
    Task<byte[]> GenerateWeeklySalesReportAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default);
}