using Iyzipay.Model;

namespace SipAndStayCafe.Application.Interfaces;

public interface IIyzicoService
{
    /// <summary>
    /// Müşterinin kredi kartı bilgilerini gireceği İyzico Checkout formunu (iframe/HTML) oluşturur.
    /// </summary>
    /// <param name="paymentId">Veritabanımızdaki PaymentTransaction Id'si (İyzico'ya ConversationId olarak gönderilecek)</param>
    /// <param name="price">Ödenecek tutar</param>
    /// <param name="callbackUrl">Ödeme sonrası İyzico'nun bize döneceği adres</param>
    Task<CheckoutFormInitialize> CreateCheckoutFormAsync(Guid paymentId, decimal price, string callbackUrl);

    /// <summary>
    /// İyzico'dan dönen token ile ödemenin gerçekten başarılı olup olmadığını sorgular.
    /// </summary>
    Task<CheckoutForm> RetrieveCheckoutFormAsync(string token);
}