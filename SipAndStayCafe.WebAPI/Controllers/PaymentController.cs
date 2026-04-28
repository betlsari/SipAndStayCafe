using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.Features.Payment;
using static SipAndStayCafe.Application.Features.Payment.IyzicoCallbackHandler;

namespace SipAndStayCafe.WebAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// İyzico'nun ödeme işlemi bittikten sonra sonuç token'ını postaladığı Callback adresi.
    /// Müşterinin yetkisi olmadığı (Auth header gönderemediği) için bu endpoint tamamen açıktır ([AllowAnonymous]).
    /// </summary>
    [HttpPost("iyzico/callback")]
    [AllowAnonymous] // Kilit Nokta: İyzico sunucularının bize ulaşabilmesi için kimlik doğrulaması kapatılmalıdır.
    public async Task<IActionResult> IyzicoCallback([FromForm] string token, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest("Token alınamadı.");
        }

        // Token ile ödeme sonucunu doğrula ve işlemi tamamla
        var redirectUrl = await _mediator.Send(new IyzicoCallbackCommand(token), ct);

        // Müşterinin tarayıcısını doğrudan frontend'deki (örn: React) başarılı/başarısız sayfasına yönlendir.
        return Redirect(redirectUrl);
    }

    // POST /api/payment/initiate-cashier
    [HttpPost("initiate-cashier")]
    [AllowAnonymous] // Müşteriler giriş yapmadığı için açık olmalı
    public async Task<IActionResult> InitiateCashierPayment([FromBody] InitiatePaymentRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new InitiateCashierPaymentCommand(request.SessionId), ct);

        if (!result.IsSuccess)
        {
            return BadRequest(new { Error = result.Error.Message });
        }

        return Ok(new { Message = "Kasiyere ödeme bildirimi gönderildi. Lütfen kasaya gidiniz." });
    }

    // POST /api/payment/initiate-online
    [HttpPost("initiate-online")]
    [AllowAnonymous]
    public async Task<IActionResult> InitiateOnlinePayment([FromBody] InitiatePaymentRequest request, CancellationToken ct)
    {
        // İyzico'nun ödeme bitince bize geri döneceği Base URL'yi dinamik hesaplıyoruz
        var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";

        var htmlContent = await _mediator.Send(
            new InitiateOnlinePaymentCommand(new InitiateOnlinePaymentRequestDto(request.SessionId, baseUrl)), ct);

        // React / Vue tarafında bu HTML içeriği bir div'in "dangerouslySetInnerHTML" özelliğine basılarak ekranda gösterilecek.
        return Ok(new { CheckoutFormContent = htmlContent });
    }

    // Request nesnesini dosyanın en altına koyabilirsin
    public record InitiatePaymentRequest(Guid SessionId);
}