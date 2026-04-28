using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.Features.Payment;

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
}