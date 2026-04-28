using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SipAndStayCafe.Application.DTOs.Report;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Services;

public class QuestPdfReportService : IReportService
{
    public QuestPdfReportService()
    {
        // QuestPDF Community lisans bildirimi (Hata fırlatmaması için zorunludur)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateDailyReportPdf(DailySalesReportDto data)
    {
        var culture = CultureInfo.GetCultureInfo("tr-TR");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                page.Header().Element(c => ComposeHeader(c, "Günlük Satış Raporu", data.Date.ToString("dd MMMM yyyy", culture)));

                page.Content().Element(c =>
                {
                    c.PaddingVertical(1, Unit.Centimetre).Column(col =>
                    {
                        col.Spacing(5); // Sütun içindeki her bir öğe arasına varsayılan 5 birim boşluk ekler

                        col.Item().Text($"Toplam Ciro: {data.TotalRevenue.ToString("C2", culture)}").Bold().FontSize(14).FontColor(Colors.Green.Darken2);
                        col.Item().Text($"Toplam Sipariş: {data.TotalOrders}").FontSize(12);

                        // Padding'i Text'ten ÖNCE container'a uyguluyoruz
                        col.Item().PaddingTop(15).PaddingBottom(5).Text("En Çok Satan Ürünler").Bold().FontSize(12);
                        ComposeTopSellingTable(col, data.TopSellingItems, culture);
                    });
                });

                page.Footer().AlignCenter().Text(x =>
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

    public byte[] GenerateWeeklyReportPdf(WeeklySalesReportDto data)
    {
        var culture = CultureInfo.GetCultureInfo("tr-TR");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                var dateStr = $"{data.StartDate.ToString("dd MMM", culture)} - {data.EndDate.ToString("dd MMM yyyy", culture)}";
                page.Header().Element(c => ComposeHeader(c, "Haftalık Satış Raporu", dateStr));

                page.Content().Element(c =>
                {
                    c.PaddingVertical(1, Unit.Centimetre).Column(col =>
                    {
                        col.Spacing(5); // Sütun içi varsayılan boşluk

                        col.Item().Text($"Genel Toplam Ciro: {data.TotalRevenue.ToString("C2", culture)}").Bold().FontSize(14).FontColor(Colors.Green.Darken2);
                        col.Item().Text($"Genel Sipariş Sayısı: {data.TotalOrders}").FontSize(12);

                        // Padding'i Text'ten ÖNCE container'a uyguluyoruz
                        col.Item().PaddingTop(15).PaddingBottom(5).Text("Haftanın En Çok Satan Ürünleri").Bold().FontSize(12);
                        ComposeTopSellingTable(col, data.TopSellingItems, culture);
                    });
                });

                page.Footer().AlignCenter().Text(x =>
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

    // --- YARDIMCI METOTLAR (Kod tekrarını önlemek için) ---

    private void ComposeHeader(IContainer container, string title, string dateStr)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text(title).FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                column.Item().Text($"Tarih: {dateStr}").FontSize(12).FontColor(Colors.Grey.Medium);
            });
            row.ConstantItem(100).Height(50).Placeholder(); // İleride buraya Cafe'nin logosunu koyabilirsin
        });
    }

    private void ComposeTopSellingTable(ColumnDescriptor col, List<TopSellingItemDto> items, CultureInfo culture)
    {
        col.Item().Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(30);  // Sıra No
                columns.RelativeColumn();    // Ürün Adı (Genişleyecek)
                columns.ConstantColumn(80);  // Adet
                columns.ConstantColumn(100); // Gelir
            });

            table.Header(header =>
            {
                header.Cell().Element(CellStyle).Text("#");
                header.Cell().Element(CellStyle).Text("Ürün Adı");
                header.Cell().Element(CellStyle).AlignRight().Text("Satış Adedi");
                header.Cell().Element(CellStyle).AlignRight().Text("Toplam Gelir");

                static IContainer CellStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
            });

            int index = 1;
            foreach (var item in items)
            {
                table.Cell().Element(CellStyle).Text(index.ToString());
                table.Cell().Element(CellStyle).Text(item.ProductName);
                table.Cell().Element(CellStyle).AlignRight().Text(item.TotalQuantitySold.ToString());
                table.Cell().Element(CellStyle).AlignRight().Text(item.TotalRevenue.ToString("C2", culture));

                index++;

                static IContainer CellStyle(IContainer container) => container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
            }
        });
    }
}