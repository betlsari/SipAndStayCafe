namespace SipAndStayCafe.Application.DTOs.Cashier;

// ==========================================
// 1. LİSTE GÖRÜNÜMÜ (Tüm Aktif Masalar)
// ==========================================

/// <summary>
/// Kasiyerin ana ekranında listelenecek masaların özet kartı.
/// </summary>
public sealed record CashierSessionDto(
    int TableNumber,
    Guid SessionId,
    DateTime OpenedAt,
    decimal TotalAmount,
    string? PaymentMethod, // Müşteri henüz ödeme yöntemi seçmemiş olabilir (null)
    string PaymentStatus,  // Örn: "Pending", "Completed"
    int OrderCount         // Masanın toplam kaç kez sipariş (round) verdiği
);

// ==========================================
// 2. DETAY GÖRÜNÜMÜ (Bir Masanın İçine Girildiğinde)
// ==========================================

/// <summary>
/// En alt kırılım: Sipariş içindeki tek bir kalem.
/// </summary>
public sealed record CashierOrderItemDto(
    string ProductName,
    int Quantity,
    List<string> ModifierSnapshots, // Örn: ["Soya Sütü", "Ekstra Karamel"]
    decimal ItemTotal
);

/// <summary>
/// Orta kırılım: Masanın verdiği tek bir sipariş round'u (Order entity'si).
/// </summary>
public sealed record CashierOrderRoundDto(
    Guid OrderId,
    string Status, // Örn: "Received", "Ready", "Completed"
    DateTime CreatedAt,
    List<CashierOrderItemDto> Items,
    decimal RoundTotal // Sadece bu sipariş round'unun toplam tutarı
);

/// <summary>
/// Üst kırılım: Kasiyer bir masaya tıkladığında açılan tam detay sayfası.
/// </summary>
public sealed record CashierSessionDetailDto(
    int TableNumber,
    Guid SessionId,
    DateTime OpenedAt,
    string PaymentStatus,
    string? PaymentMethod,
    decimal GrandTotal,                 // Masanın ödemesi gereken genel toplam
    List<CashierOrderRoundDto> OrderRounds // Masanın o oturumdaki tüm sipariş geçmişi
);