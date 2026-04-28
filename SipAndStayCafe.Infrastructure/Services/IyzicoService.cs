using Iyzipay;
using Iyzipay.Model;
using Iyzipay.Request;
using Microsoft.Extensions.Configuration;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Services;

public class IyzicoService : IIyzicoService
{
    private readonly Options _options;

    public IyzicoService(IConfiguration configuration)
    {
        // appsettings'den değerleri okuyup SDK'nın Options nesnesini hazırlıyoruz
        _options = new Options
        {
            ApiKey = configuration["IyzicoSettings:ApiKey"],
            SecretKey = configuration["IyzicoSettings:SecretKey"],
            BaseUrl = configuration["IyzicoSettings:BaseUrl"]
        };
    }

    public async Task<CheckoutFormInitialize> CreateCheckoutFormAsync(Guid paymentId, decimal price, string callbackUrl)
    {
        // 1. İyzico İstek Nesnesini Hazırla
        var request = new CreateCheckoutFormInitializeRequest
        {
            Locale = Locale.TR.ToString(),
            ConversationId = paymentId.ToString(), // Bize ait olan eşsiz işlem numarası
            Price = price.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture), // İyzico string bekler
            PaidPrice = price.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture),
            Currency = Currency.TRY.ToString(),
            BasketId = Guid.NewGuid().ToString(), // Sepet ID
            PaymentGroup = PaymentGroup.PRODUCT.ToString(),
            CallbackUrl = callbackUrl // Ödeme sonrası döneceği Webhook/Callback adresi
        };

        // 2. Alıcı (Buyer) Bilgileri
        // Cafe sisteminde üyelik zorunlu olmadığı için "Guest" olarak sabit dummy bilgiler geçiyoruz.
        // Gerçek bir e-ticarette bunlar müşteriden alınır.
        var buyer = new Buyer
        {
            Id = "BY789",
            Name = "Cafe",
            Surname = "Müşterisi",
            GsmNumber = "+905324000000",
            Email = "email@email.com",
            IdentityNumber = "74300864791",
            LastLoginDate = "2024-01-01 10:00:00",
            RegistrationDate = "2024-01-01 10:00:00",
            RegistrationAddress = "Cafe İçi Sipariş",
            Ip = "85.34.78.112",
            City = "Izmir",
            Country = "Turkey",
            ZipCode = "35000"
        };
        request.Buyer = buyer;

        // 3. Fatura ve Kargo Adresleri (İyzico için zorunludur, dummy geçiyoruz)
        var address = new Address
        {
            ContactName = "Cafe Müşterisi",
            City = "Izmir",
            Country = "Turkey",
            Description = "Cafe İçi Sipariş",
            ZipCode = "35000"
        };
        request.ShippingAddress = address;
        request.BillingAddress = address;

        // 4. Sepet İçeriği (En az 1 adet zorunludur)
        // Sepet detaylarını tek tek göndermek yerine "Masa Hesabı" diyerek tek kalem geçmek cafeler için uygundur.
        var basketItems = new List<BasketItem>
        {
            new BasketItem
            {
                Id = "BI101",
                Name = "Masa Siparişi Toplamı",
                Category1 = "Yeme İçme",
                ItemType = BasketItemType.PHYSICAL.ToString(),
                Price = request.Price
            }
        };
        request.BasketItems = basketItems;

        // İyzico'ya isteği at
        var checkoutFormInitialize = await CheckoutFormInitialize.Create(request, _options);

        return checkoutFormInitialize;
    }

    public async Task<CheckoutForm> RetrieveCheckoutFormAsync(string token)
    {
        var request = new RetrieveCheckoutFormRequest
        {
            Token = token
        };

        var checkoutForm = await CheckoutForm.Retrieve(request, _options);
        return checkoutForm;
    }
}