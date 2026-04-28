namespace SipAndStayCafe.Application.DTOs.Order;

// ==========================================
// 1. REQUEST DTOs (Müşteriden / İstemciden Gelenler)
// ==========================================

/// <summary>
/// Müşterinin sipariş verirken göndereceği tek bir ürün satırı.
/// </summary>
public sealed record OrderItemRequest(
    Guid MenuItemId,
    int Quantity,
    List<Guid> SelectedModifierIds);

/// <summary>
/// Müşterinin sepetini onaylayıp gönderdiği ana sipariş payload'u.
/// </summary>
public sealed record PlaceOrderRequest(
    int TableNumber,
    List<OrderItemRequest> Items,
    string? Note);

/// <summary>
/// Müşterinin garson çağırma isteği.
/// </summary>
public sealed record WaiterCallRequest(
    int TableNumber,
    string? Note);

// ==========================================
// 2. RESPONSE DTOs (Sistemden İstemciye Dönenler)
// ==========================================

/// <summary>
/// Sipariş satırının detaylı görünümü.
/// ModifierSnapshots: O anki modifier isimleri (örn: "Ekstra Karamel", "Soya Sütü").
/// </summary>
public sealed record OrderItemDto(
    Guid Id,
    string ProductName,
    int Quantity,
    List<string> ModifierSnapshots,
    decimal ItemTotal);

/// <summary>
/// Bir siparişin tam detayı.
/// Status string olarak dönülür (örn: "Received", "BeingPrepared").
/// </summary>
public sealed record OrderDto(
    Guid Id,
    string Status,
    List<OrderItemDto> Items,
    decimal Total,
    DateTime CreatedAt,
    string? Note);

/// <summary>
/// Masa özeti gibi listelemelerde kullanılacak hafif (lightweight) sipariş nesnesi.
/// Alt kalemleri (Items) içermez, sadece genel durumu ve toplamı gösterir.
/// </summary>
public sealed record OrderSummaryDto(
    Guid Id,
    string Status,
    decimal Total,
    DateTime CreatedAt);

/// <summary>
/// Masanın o anki aktif oturumuna (session) ait tüm sipariş geçmişi ve genel hesap özeti.
/// </summary>
public sealed record TableOrderHistoryDto(
    int TableNumber,
    List<OrderDto> Orders,
    decimal GrandTotal);