using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Infrastructure.Persistence;

namespace SipAndStayCafe.Infrastructure.Services;

public sealed class QuestPdfReportService : IReportService
{
    private readonly AppDbContext _db;

    public QuestPdfReportService(AppDbContext db)
    {
        // QuestPDF community lisansı — ücretsiz kullanım için gerekli
        QuestPDF.Settings.License = LicenseType.Community;
        _db = db;
    }

    public async Task<byte[]> GenerateWeeklySalesReportAsync(
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        // Tarih aralığını UTC DateTime'a çevir
        var fromDt = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toDt = to.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        // Kapatılmış (ödenmiş) session'ları çek
        var sessions = await _db.TableSessions
            .Where(s => s.IsPaid
                     && s.ClosedAt >= fromDt
                     && s.ClosedAt <= toDt)
            .Include(s => s.Table)
            .Include(s => s.Orders)
                .ThenInclude(o => o.OrderItems)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // En çok satan ürünler
        var topItems = sessions
            .SelectMany(s => s.Orders)
            .SelectMany(o => o.OrderItems)
            .GroupBy(i => i.MenuItemNameSnapshot)
            .Select(g => new { Name = g.Key, Qty = g.Sum(i => i.Quantity), Revenue = g.Sum(i => i.ItemTotal) })
            .OrderByDescending(x => x.Revenue)
            .Take(10)
            .ToList();

        var totalRevenue = sessions.Sum(s => s.TotalAmount);

        // QuestPDF belgesi
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Text($"Haftalık Satış Raporu — {from:dd.MM.yyyy} / {to:dd.MM.yyyy}")
                    .SemiBold().FontSize(16).AlignCenter();

                page.Content().Column(col =>
                {
                    col.Item().PaddingVertical(10).Text($"Toplam Gelir: {totalRevenue:C2}")
                        .Bold().FontSize(13);

                    col.Item().Text($"Kapanan Masa Oturumu: {sessions.Count}");

                    col.Item().PaddingTop(15).Text("En Çok Satan 10 Ürün").Bold();

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(4);  // Ürün adı
                            cols.RelativeColumn(2);  // Adet
                            cols.RelativeColumn(2);  // Gelir
                        });

                        // Başlık satırı
                        table.Header(header =>
                        {
                            header.Cell().Text("Ürün").Bold();
                            header.Cell().Text("Adet").Bold();
                            header.Cell().Text("Gelir").Bold();
                        });

                        foreach (var item in topItems)
                        {
                            table.Cell().Text(item.Name);
                            table.Cell().Text(item.Qty.ToString());
                            table.Cell().Text(item.Revenue.ToString("C2"));
                        }
                    });
                });

                page.Footer().AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Sayfa ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
            });
        });

        return document.GeneratePdf();
    }
}