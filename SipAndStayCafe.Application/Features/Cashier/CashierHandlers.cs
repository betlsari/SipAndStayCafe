using MediatR;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.DTOs.Cashier;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Common;
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
        var sessions = await _queryableSessionRepo.FindWithIncludesAsync(
            s => s.ClosedAt == null,
            q => q.Include(s => s.Table).Include(s => s.Orders),
            cancellationToken);

        return sessions.Select(s => new CashierSessionDto(
            TableNumber: s.Table.TableNumber,
            SessionId: s.Id,
            OpenedAt: s.OpenedAt,
            TotalAmount: s.TotalAmount,
            // Enum None ise null dön, aksi halde string'e çevir
            PaymentMethod: s.PaymentMethod == PaymentMethod.None ? null : s.PaymentMethod.ToString(),
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
        var sessions = await _queryableSessionRepo.FindWithIncludesAsync(
            s => s.Id == request.SessionId,
            q => q.Include(s => s.Table)
                  .Include(s => s.Orders)
                    .ThenInclude(o => o.OrderItems),
            cancellationToken);

        var session = sessions.FirstOrDefault();

        if (session == null)
            throw new NotFoundException(nameof(TableSession), request.SessionId);

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
            // Enum None ise null dön, aksi halde string'e çevir
            PaymentMethod: session.PaymentMethod == PaymentMethod.None ? null : session.PaymentMethod.ToString(),
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
            // Burada zaten Cashier filtresi var, kesin dolu olduğu için null kontrolüne gerek yok
            PaymentMethod: s.PaymentMethod.ToString(),
            PaymentStatus: s.PaymentStatus.ToString(),
            OrderCount: s.Orders.Count
        )).ToList();
    }
}// Add this to the QUERIES section with other records:
// ==========================================
// 3. COMMANDS & YAZMA İŞLEMLERİ (YENİ EKLENEN)
// ==========================================

public record ConfirmCashierPaymentCommand(Guid SessionId) : IRequest<Result<bool>>;

public class ConfirmCashierPaymentHandler : IRequestHandler<ConfirmCashierPaymentCommand, Result<bool>>
{
    private readonly IQueryableRepository<TableSession> _queryableSessionRepo;
    private readonly IRepository<TableSession> _sessionRepo;
    private readonly IPaymentNotificationService _paymentNotificationService;
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmCashierPaymentHandler(
        IQueryableRepository<TableSession> queryableSessionRepo,
        IRepository<TableSession> sessionRepo,
        IPaymentNotificationService paymentNotificationService,
        IUnitOfWork unitOfWork)
    {
        _queryableSessionRepo = queryableSessionRepo;
        _sessionRepo = sessionRepo;
        _paymentNotificationService = paymentNotificationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(ConfirmCashierPaymentCommand request, CancellationToken cancellationToken)
    {
        // 1. Session'ı ve bağlı olduğu masayı (TableNumber için) Eager Load ile getiriyoruz
        var session = await _queryableSessionRepo.GetByIdWithIncludesAsync(
            request.SessionId,
            q => q.Include(s => s.Table),
            cancellationToken);

        if (session == null)
            throw new NotFoundException(nameof(TableSession), request.SessionId);

        if (session.ClosedAt.HasValue)
            return Result<bool>.Failure(Error.Create("Session.AlreadyClosed", "Bu masa oturumu zaten kapatılmış."));

        // 2. Müşteri kendi telefonundan "Kasiyerde Öde" tuşuna basmadıysa bile,
        // kasiyer işlemi onaylarken ödeme yöntemini 'Cashier' olarak belirliyoruz.
        if (session.PaymentMethod == PaymentMethod.None)
        {
            // Bu metot arka planda PaymentMethod = Cashier ve PaymentStatus = Pending yapar
            session.InitiateCashierPayment();
        }

        // 3. Entity içindeki kapsüllenmiş ve idempotent olan kapatma metodunu çağırıyoruz.
        // Bu metot arka planda PaymentStatus = Completed yapar ve ClosedAt değerini atar.
        session.Close();

        _sessionRepo.Update(session);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4. Kapanış bildirimini gönderiyoruz (SignalR üzerinden ekranları güncelleyecek)
        await _paymentNotificationService.NotifyTableSessionClosedAsync(session.Table.TableNumber, cancellationToken);

        return Result<bool>.Success(true);
    }
}
