using MediatR;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.DTOs.Cashier;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Entities;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Application.Features.Cashier;

// ==========================================
// 1. QUERIES
// ==========================================

public record GetActiveSessionsQuery() : IRequest<IReadOnlyList<CashierSessionDto>>;

public record GetSessionDetailQuery(Guid SessionId) : IRequest<CashierSessionDetailDto>;

public record GetPendingCashierPaymentsQuery() : IRequest<IReadOnlyList<CashierSessionDto>>;

// ==========================================
// 2. HANDLERS
// ==========================================

public class GetActiveSessionsHandler : IRequestHandler<GetActiveSessionsQuery, IReadOnlyList<CashierSessionDto>>
{
    private readonly IQueryableRepository<TableSession> _queryableSessionRepo;

    public GetActiveSessionsHandler(IQueryableRepository<TableSession> queryableSessionRepo)
    {
        _queryableSessionRepo = queryableSessionRepo;
    }

    public async Task<IReadOnlyList<CashierSessionDto>> Handle(GetActiveSessionsQuery request, CancellationToken cancellationToken)
    {
        // Sadece açık olan oturumları, masa ve sipariş bilgileriyle Eager Load yapıyoruz
        var sessions = await _queryableSessionRepo.FindWithIncludesAsync(
            s => s.ClosedAt == null,
            q => q.Include(s => s.Table).Include(s => s.Orders),
            cancellationToken);

        return sessions.Select(s => new CashierSessionDto(
            TableNumber: s.Table.TableNumber,
            SessionId: s.Id,
            OpenedAt: s.OpenedAt,
            TotalAmount: s.TotalAmount,
            PaymentMethod: s.PaymentMethod?.ToString(),
            PaymentStatus: s.PaymentStatus.ToString(),
            OrderCount: s.Orders.Count
        )).ToList();
    }
}

public class GetSessionDetailHandler : IRequestHandler<GetSessionDetailQuery, CashierSessionDetailDto>
{
    private readonly IQueryableRepository<TableSession> _queryableSessionRepo;

    public GetSessionDetailHandler(IQueryableRepository<TableSession> queryableSessionRepo)
    {
        _queryableSessionRepo = queryableSessionRepo;
    }

    public async Task<CashierSessionDetailDto> Handle(GetSessionDetailQuery request, CancellationToken cancellationToken)
    {
        // Masanın içine tıklandığında sipariş detaylarını ve içindeki ürünleri çekiyoruz
        var sessions = await _queryableSessionRepo.FindWithIncludesAsync(
            s => s.Id == request.SessionId,
            q => q.Include(s => s.Table)
                  .Include(s => s.Orders)
                    .ThenInclude(o => o.OrderItems),
            cancellationToken);

        var session = sessions.FirstOrDefault();

        if (session == null)
            throw new NotFoundException(nameof(TableSession), request.SessionId);

        // İç içe hiyerarşiyi (OrderRounds -> OrderItems) dolduruyoruz
        var orderRoundDtos = session.Orders
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new CashierOrderRoundDto(
                OrderId: o.Id,
                Status: o.Status.ToString(),
                CreatedAt: o.CreatedAt,
                RoundTotal: o.OrderItems.Sum(i => i.ItemTotal),
                Items: o.OrderItems.Select(i => new CashierOrderItemDto(
                    ProductName: i.MenuItemNameSnapshot,
                    Quantity: i.Quantity,
                    ModifierSnapshots: i.SelectedModifiers.Select(m => m.Name).ToList(),
                    ItemTotal: i.ItemTotal
                )).ToList()
            )).ToList();

        return new CashierSessionDetailDto(
            TableNumber: session.Table.TableNumber,
            SessionId: session.Id,
            OpenedAt: session.OpenedAt,
            PaymentStatus: session.PaymentStatus.ToString(),
            PaymentMethod: session.PaymentMethod?.ToString(),
            GrandTotal: session.TotalAmount,
            OrderRounds: orderRoundDtos
        );
    }
}

public class GetPendingCashierPaymentsHandler : IRequestHandler<GetPendingCashierPaymentsQuery, IReadOnlyList<CashierSessionDto>>
{
    private readonly IQueryableRepository<TableSession> _queryableSessionRepo;

    public GetPendingCashierPaymentsHandler(IQueryableRepository<TableSession> queryableSessionRepo)
    {
        _queryableSessionRepo = queryableSessionRepo;
    }

    public async Task<IReadOnlyList<CashierSessionDto>> Handle(GetPendingCashierPaymentsQuery request, CancellationToken cancellationToken)
    {
        // Müşteri telefondan "Kasada Öde" tuşuna basmış ve "Pending" durumunda olan oturumları filtreliyoruz
        var sessions = await _queryableSessionRepo.FindWithIncludesAsync(
            s => s.ClosedAt == null
                 && s.PaymentMethod == PaymentMethod.Cashier
                 && s.PaymentStatus == PaymentStatus.Pending,
            q => q.Include(s => s.Table).Include(s => s.Orders),
            cancellationToken);

        return sessions.Select(s => new CashierSessionDto(
            TableNumber: s.Table.TableNumber,
            SessionId: s.Id,
            OpenedAt: s.OpenedAt,
            TotalAmount: s.TotalAmount,
            PaymentMethod: s.PaymentMethod?.ToString(), // Kasiyer olarak dolu gelecek
            PaymentStatus: s.PaymentStatus.ToString(),  // Pending olarak dolu gelecek
            OrderCount: s.Orders.Count
        )).ToList();
    }
}