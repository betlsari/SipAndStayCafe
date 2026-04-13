using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SipAndStayCafe.Application.DTOs.Menu;
using SipAndStayCafe.Application.Features.Menu.MenuItems;
using SipAndStayCafe.Application.Features.Menu.Modifiers;

namespace SipAndStayCafe.WebAPI.Controllers;

/// <summary>
/// Menu item management and the public customer menu endpoint.
///
/// Anonymous:
///   GET  /api/menu                         — full public menu (cached)
///
/// Owner:
///   GET    /api/menu/items                 — all items (admin)
///   GET    /api/menu/items/{id}            — item detail
///   POST   /api/menu/items                 — create
///   PUT    /api/menu/items/{id}            — update
///   DELETE /api/menu/items/{id}            — delete
///   PATCH  /api/menu/items/{id}/stock      — update today's availability
///
///   POST   /api/menu/modifier-groups       — add modifier group to item
///   PUT    /api/menu/modifier-groups/{id}  — update modifier group
///   DELETE /api/menu/modifier-groups/{id}  — delete modifier group
///
///   POST   /api/menu/modifiers             — add modifier to group
///   PUT    /api/menu/modifiers/{id}        — update modifier
///   DELETE /api/menu/modifiers/{id}        — delete modifier
/// </summary>
[ApiController]
[Route("api/menu")]
public sealed class MenuItemController : ControllerBase
{
    private readonly IMediator _mediator;

    public MenuItemController(IMediator mediator) => _mediator = mediator;

    // ── Public endpoint ──────────────────────────────────────────────────────

    /// <summary>
    /// Returns the full public menu.
    /// Available to anonymous customers (no auth required).
    /// Response is served from Redis cache; invalidated on any menu/stock change.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<MenuCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicMenu(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPublicMenuQuery(), ct);
        return Ok(result);
    }

    // ── Admin: MenuItem CRUD ─────────────────────────────────────────────────

    [HttpGet("items")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(IReadOnlyList<MenuItemSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllItems(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAllMenuItemsQuery(), ct);
        return Ok(result);
    }

    [HttpGet("items/{id:guid}")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(MenuItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetItemById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMenuItemByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("items")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(MenuItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateItem(
        [FromBody] CreateMenuItemRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateMenuItemCommand(request), ct);
        return CreatedAtAction(nameof(GetItemById), new { id = result.Id }, result);
    }

    [HttpPut("items/{id:guid}")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(MenuItemSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(Guid id,
        [FromBody] UpdateMenuItemRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateMenuItemCommand(id, request), ct);
        return Ok(result);
    }

    [HttpDelete("items/{id:guid}")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItem(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteMenuItemCommand(id), ct);
        return NoContent();
    }

    /// <summary>
    /// Updates today's stock availability for an item.
    /// Also syncs MenuItem.IsAvailable and invalidates the menu cache.
    /// </summary>


    /// <summary>
    /// Updates today's stock availability for a menu item.
    ///
    /// Returns:
    ///   204 No Content  — update applied successfully.
    ///   404 Not Found   — item does not exist.
    ///   409 Conflict    — concurrent modification; client should retry.
    /// </summary>
    [HttpPatch("items/{id:guid}/stock")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateStock(
        Guid id,
        [FromBody] UpdateStockRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateStockCommand(id, request), ct);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "Conflict" => Conflict(new { code = result.Error.Code, message = result.Error.Message }),
                _ => StatusCode(StatusCodes.Status500InternalServerError,
                                  new { code = result.Error.Code, message = result.Error.Message })
            };
        }

        return NoContent();
    }
    // ── Admin: ModifierGroup CRUD ────────────────────────────────────────────

    [HttpPost("modifier-groups")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(ModifierGroupDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateModifierGroup(
        [FromBody] CreateModifierGroupRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateModifierGroupCommand(request), ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("modifier-groups/{id:guid}")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(ModifierGroupDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateModifierGroup(Guid id,
        [FromBody] UpdateModifierGroupRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateModifierGroupCommand(id, request), ct);
        return Ok(result);
    }

    [HttpDelete("modifier-groups/{id:guid}")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteModifierGroup(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteModifierGroupCommand(id), ct);
        return NoContent();
    }

    // ── Admin: Modifier CRUD ─────────────────────────────────────────────────

    [HttpPost("modifiers")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(ModifierDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateModifier(
        [FromBody] CreateModifierRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateModifierCommand(request), ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPut("modifiers/{id:guid}")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(typeof(ModifierDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateModifier(Guid id,
        [FromBody] UpdateModifierRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateModifierCommand(id, request), ct);
        return Ok(result);
    }

    [HttpDelete("modifiers/{id:guid}")]
    [Authorize(Roles = "Owner")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteModifier(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteModifierCommand(id), ct);
        return NoContent();
    }
}