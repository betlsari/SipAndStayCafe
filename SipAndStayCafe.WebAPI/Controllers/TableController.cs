using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.DTOs.Table;
using SipAndStayCafe.Application.Features.Tables;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.WebAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TablesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IQrCodeService _qrCodeService;

    public TablesController(IMediator mediator, IQrCodeService qrCodeService)
    {
        _mediator = mediator;
        _qrCodeService = qrCodeService;
    }

    // GET /api/tables
    [HttpGet]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetAllTables(CancellationToken ct)
    {
        var tables = await _mediator.Send(new GetAllTablesQuery(), ct);
        return Ok(tables);
    }

    // GET /api/tables/verify/{tableNumber}  ← YENİ: Müşteri masa doğrulama (anonim)
    [HttpGet("verify/{tableNumber:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyTable(int tableNumber, CancellationToken ct)
    {
        var tables = await _mediator.Send(new GetAllTablesQuery(), ct);
        var table = tables.FirstOrDefault(t => t.TableNumber == tableNumber);

        if (table == null)
            return NotFound(new { message = "Masa bulunamadı." });

        if (!table.IsActive)
            return BadRequest(new { message = "inactive" });

        return Ok(table);
    }

    // GET /api/tables/{id}
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetTableById(Guid id, CancellationToken ct)
    {
        var table = await _mediator.Send(new GetTableByIdQuery(id), ct);
        return Ok(table);
    }

    // POST /api/tables
    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateTable([FromBody] CreateTableRequest request, CancellationToken ct)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
        var createdTable = await _mediator.Send(new CreateTableCommand(request, baseUrl), ct);
        return CreatedAtAction(nameof(GetTableById), new { id = createdTable.Id }, createdTable);
    }

    // PUT /api/tables/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdateTable(Guid id, [FromBody] UpdateTableRequest request, CancellationToken ct)
    {
        var updatedTable = await _mediator.Send(new UpdateTableCommand(id, request), ct);
        return Ok(updatedTable);
    }

    // DELETE /api/tables/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> DeleteTable(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteTableCommand(id), ct);
        return NoContent();
    }

    // GET /api/tables/{id}/qr
    [HttpGet("{id:guid}/qr")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetQrCode(Guid id, CancellationToken ct)
    {
        var table = await _mediator.Send(new GetTableByIdQuery(id), ct);
        var imageBytes = _qrCodeService.GenerateQrCodeImage(table.QRCodeUrl);
        return File(imageBytes, "image/png", $"table-{table.TableNumber}-qr.png");
    }

    // GET /api/tables/{id}/session
    [HttpGet("{id:guid}/session")]
    [Authorize(Roles = "Owner,Cashier")]
    public async Task<IActionResult> GetActiveSession(Guid id, CancellationToken ct)
    {
        var session = await _mediator.Send(new GetActiveTableSessionQuery(id), ct);

        if (session == null)
            return NoContent();

        return Ok(session);
    }

    // POST /api/tables/{id}/session/open
    [HttpPost("{id:guid}/session/open")]
    [Authorize(Roles = "Cashier,System")]
    public async Task<IActionResult> OpenSession(Guid id, CancellationToken ct)
    {
        var session = await _mediator.Send(new OpenTableSessionCommand(id), ct);
        return Ok(session);
    }

    // POST /api/tables/{id}/session/close
    [HttpPost("{id:guid}/session/close")]
    [Authorize(Roles = "Cashier")]
    public async Task<IActionResult> CloseSession(Guid id, [FromBody] CloseSessionRequest body, CancellationToken ct)
    {
        var result = await _mediator.Send(new CloseTableSessionCommand(body.SessionId), ct);

        if (!result.IsSuccess)
            return BadRequest(new { Error = result.Error.Message });

        return Ok(new { Message = "Masa oturumu başarıyla kapatıldı." });
    }
}

public record CloseSessionRequest(Guid SessionId);