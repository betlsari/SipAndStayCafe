using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.Features.Cashier;

namespace SipAndStayCafe.WebAPI.Controllers;

[Route("api/cashier")] // Kasiyer modülünün ana adresi
[ApiController]
[Authorize(Roles = "Cashier,Owner")] // Sisteme sadece Kasiyerler ve Mekan Sahipleri erişebilir
public class CashierController : ControllerBase
{
    private readonly IMediator _mediator;

    public CashierController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // GET /api/cashier/sessions
    [HttpGet("sessions")]
    public async Task<IActionResult> GetActiveSessions(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetActiveSessionsQuery(), ct);
        return Ok(result);
    }

    // GET /api/cashier/sessions/pending-payment
    // Not: Bu endpoint {id:guid} parametreli route'dan YUKARIDA olmalıdır ki routing çakışmasın
    [HttpGet("sessions/pending-payment")]
    public async Task<IActionResult> GetPendingPayments(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPendingCashierPaymentsQuery(), ct);
        return Ok(result);
    }

    // GET /api/cashier/sessions/{id}
    [HttpGet("sessions/{id:guid}")]
    public async Task<IActionResult> GetSessionDetail(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetSessionDetailQuery(id), ct);
        return Ok(result);
    }

    // POST /api/cashier/sessions/{id}/confirm-payment
    [HttpPost("sessions/{id:guid}/confirm-payment")]
    public async Task<IActionResult> ConfirmPayment(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new ConfirmCashierPaymentCommand(id), ct);

        if (!result.IsSuccess)
        {
            return BadRequest(new { Error = result.Error.Message });
        }

        return Ok(new { Message = "Ödeme başarıyla alındı ve masa kapatıldı." });
    }
}