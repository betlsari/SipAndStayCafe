using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.DTOs.Order;
using SipAndStayCafe.Application.Features.Orders;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.WebAPI.Controllers;

/// <summary>
/// Sipariş yönetimi.
///
/// Anonymous : POST /api/orders              — sipariş ver
/// Anonymous : GET  /api/orders/table/{no}   — masa sipariş geçmişi
/// Anonymous : POST /api/orders/call-waiter  — garson çağır
/// Kitchen   : PATCH /api/orders/{id}/status — sipariş durumu güncelle
/// </summary>
[ApiController]
[Route("api/orders")]
public sealed class OrderController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrderController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Müşteri siparişini gönderir.
    /// Aktif oturum yoksa otomatik açar.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PlaceOrder(
        [FromBody] PlaceOrderRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new PlaceOrderCommand(request), ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>
    /// Masanın aktif oturumundaki tüm siparişleri ve genel toplamı döner.
    /// </summary>
    [HttpGet("table/{tableNumber:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TableOrderHistoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTableOrderHistory(
        int tableNumber, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTableOrderHistoryQuery(tableNumber), ct);
        return Ok(result);
    }

    /// <summary>
    /// Mutfak ekranı: sipariş durumunu günceller.
    /// Received → BeingPrepared → Ready
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "KitchenStaff")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrderStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken ct)
    {
        await _mediator.Send(new UpdateOrderStatusCommand(id, request.NewStatus), ct);
        return NoContent();
    }

    /// <summary>
    /// Müşteri garson çağırır.
    /// </summary>
    [HttpPost("call-waiter")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CallWaiter(
        [FromBody] WaiterCallRequest request, CancellationToken ct)
    {
        await _mediator.Send(new CallWaiterCommand(request), ct);
        return NoContent();
    }

[HttpGet("kitchen")]
    [Authorize(Roles = "KitchenStaff")]
    [ProducesResponseType(typeof(List<KitchenOrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetKitchenActiveOrders(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetKitchenActiveOrdersQuery(), ct);
        return Ok(result);
    }
}
/// <summary>Mutfak ekranı durum güncelleme request DTO'su.</summary>
public sealed record UpdateOrderStatusRequest(OrderStatus NewStatus);