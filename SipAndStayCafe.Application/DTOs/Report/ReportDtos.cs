namespace SipAndStayCafe.Application.DTOs.Report;

/// <summary>
/// Belirli bir zaman diliminde en çok satan ürünün istatistikleri.
/// </summary>
public sealed record TopSellingItemDto(
    Guid MenuItemId,
    string ProductName,
    int TotalQuantitySold,
    decimal TotalRevenue
);

/// <summary>
/// Gün içindeki saatlik satış kırılımı (Peak hours tespiti için).
/// </summary>
public sealed record HourlySalesDto(
    int Hour,          // 0 ile 23 arası saat bilgisi (Örn: 14 -> 14:00 - 14:59 arası)
    int OrderCount,    // O saat diliminde alınan toplam sipariş sayısı
    decimal Revenue    // O saat diliminde elde edilen gelir
);

/// <summary>
/// Haftalık raporun içindeki gün gün özet liste için kullanılır.
/// </summary>
public sealed record DailySalesSummaryDto(
    DateTime Date,
    int OrderCount,
    decimal Revenue
);

/// <summary>
/// Günlük Satış Raporu DTO'su.
/// </summary>
public sealed record DailySalesReportDto(
    DateTime Date,
    decimal TotalRevenue,
    int TotalOrders,
    List<HourlySalesDto> HourlySales,         // Günün saat saat yoğunluk analizi
    List<TopSellingItemDto> TopSellingItems   // O gün en çok satan ürünler
);

/// <summary>
/// Haftalık Satış Raporu DTO'su.
/// </summary>
public sealed record WeeklySalesReportDto(
    DateTime StartDate,
    DateTime EndDate,
    decimal TotalRevenue,
    int TotalOrders,
    List<DailySalesSummaryDto> DailySales,    // Haftanın 7 gününün tek tek özeti
    List<TopSellingItemDto> TopSellingItems   // O hafta en çok satan ürünler
);