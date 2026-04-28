using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.DTOs.Cashier;
using SipAndStayCafe.Application.Features.Cashier;

namespace SipAndStayCafe.WebAPI.Controllers
{
    /// <summary>
    /// Kasiyer paneli.
    ///
    /// Cashier/Owner : GET /api/cashier/sessions              — Aktif oturumlar
    /// Cashier/Owner : GET /api/cashier/sessions/{sessionId}  — Oturum detayı
    /// Cashier/Owner : GET /api/cashier/sessions/pending      — Beklemede olan ödemeler
    /// </summary>
    [ApiController]
    [Route("api/cashier")]
    [Authorize(Roles = "Cashier,Owner")]
    public sealed class CashierController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CashierController(IMediator mediator) => _mediator = mediator;

        /// <summary>
        /// Açık oturumların özet listesini döner.
        /// </summary>
        [HttpGet("sessions")]
        [ProducesResponseType(typeof(IReadOnlyList<CashierSessionDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveSessions(CancellationToken ct)
        {
            var result = await _mediator.Send(new GetActiveSessionsQuery(), ct);
            return Ok(result);
        }

        /// <summary>
        /// Belirli bir oturumun detaylarını döner (tüm sipariş round'ları ve kalemleri).
        /// </summary>
        [HttpGet("sessions/{sessionId:guid}")]
        [ProducesResponseType(typeof(CashierSessionDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSessionDetail(
            Guid sessionId, CancellationToken ct)
        {
            var result = await _mediator.Send(new GetSessionDetailQuery(sessionId), ct);
            return Ok(result);
        }

        /// <summary>
        /// Müşteri tarafından "Kasada Öde" seçeneği seçilerek, kasiyer tarafından ödenmesi gereken oturumları döner.
        /// </summary>
        [HttpGet("sessions/pending")]
        [ProducesResponseType(typeof(IReadOnlyList<CashierSessionDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPendingCashierPayments(CancellationToken ct)
        {
            var result = await _mediator.Send(new GetPendingCashierPaymentsQuery(), ct);
            return Ok(result);
        }
    }
}
