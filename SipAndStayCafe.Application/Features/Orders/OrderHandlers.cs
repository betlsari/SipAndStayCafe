using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.DTOs.Order;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Entities;
using SipAndStayCafe.Domain.Enums;
using SipAndStayCafe.Domain.ValueObjects;

namespace SipAndStayCafe.Application.Features.Orders;

// ==========================================
// 1. COMMANDS & QUERIES
// ==========================================

public record PlaceOrderCommand(PlaceOrderRequest Request) : IRequest<OrderDto>;
public record GetTableOrderHistoryQuery(int TableNumber) : IRequest<TableOrderHistoryDto>;
public record UpdateOrderStatusCommand(Guid OrderId, OrderStatus NewStatus) : IRequest;
public record CallWaiterCommand(WaiterCallRequest Request) : IRequest;

// ==========================================
// 2. HANDLERS
// ==========================================

public class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, OrderDto>
{
    private readonly IRepository<Table> _tableRepo;
    private readonly IRepository<TableSession> _sessionRepo;
    private readonly IQueryableRepository<MenuItem> _queryableMenuItemRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOrderNotificationService _orderNotificationService;


    public PlaceOrderHandler(
        IRepository<Table> tableRepo,
        IRepository<TableSession> sessionRepo,
        IQueryableRepository<MenuItem> queryableMenuItemRepo,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IOrderNotificationService orderNotificationService)  // ← ekle
    {
        _tableRepo = tableRepo;
        _sessionRepo = sessionRepo;
        _queryableMenuItemRepo = queryableMenuItemRepo;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _orderNotificationService = orderNotificationService;  // ← ekle
    }
    public async Task<OrderDto> Handle(PlaceOrderCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        // 1. Masa Kontrolü (IRepository.FirstOrDefaultAsync)
        var table = await _tableRepo.FirstOrDefaultAsync(t => t.TableNumber == request.TableNumber, cancellationToken);

        if (table == null || !table.IsActive)
            throw new NotFoundException(nameof(Table), request.TableNumber);

        // 2. Aktif Oturum (Session) Kontrolü & Otomatik Açma
        var session = await _sessionRepo.FirstOrDefaultAsync(s => s.TableId == table.Id && s.ClosedAt == null, cancellationToken);

        if (session == null)
        {
            session = new TableSession
            {
                TableId = table.Id,
                OpenedAt = DateTime.UtcNow,
                TotalAmount = 0m
            };
            await _sessionRepo.AddAsync(session, cancellationToken);
        }

        // 3. Sipariş Kalemleri ve Fiyat Hesaplama
        var orderItems = new List<OrderItem>();
        decimal orderTotal = 0m;

        foreach (var itemReq in request.Items)
        {
            var menuItems = await _queryableMenuItemRepo.FindWithIncludesAsync(
                m => m.Id == itemReq.MenuItemId,
                q => q.Include(m => m.ModifierGroups).ThenInclude(g => g.Modifiers),
                cancellationToken);

            var menuItem = menuItems.FirstOrDefault();

            if (menuItem == null || !menuItem.IsAvailable)
            {
                throw new ValidationException(new Dictionary<string, string[]> {
                    { "MenuItem", new[] { $"Ürün bulunamadı veya stokta yok. (ID: {itemReq.MenuItemId})" } }
                });
            }

            decimal itemBasePrice = menuItem.BasePrice;
            decimal modifiersPrice = 0m;
            var orderItemModifiers = new List<OrderItemModifier>();

            // Modifier Validasyonu
            foreach (var group in menuItem.ModifierGroups)
            {
                var selectedIdsInGroup = group.Modifiers
                    .Where(m => itemReq.SelectedModifierIds.Contains(m.Id) && m.IsActive)
                    .Select(m => m.Id)
                    .ToList();

                if (group.SelectionType == ModifierSelectionType.Single && selectedIdsInGroup.Count > 1)
                    throw new ValidationException(new Dictionary<string, string[]> { { "Modifier", new[] { $"'{group.Name}' grubu için sadece tek bir seçim yapabilirsiniz." } } });

                if (group.IsRequired && selectedIdsInGroup.Count == 0)
                    throw new ValidationException(new Dictionary<string, string[]> { { "Modifier", new[] { $"'{group.Name}' grubundan en az bir seçim yapmak zorunludur." } } });

                foreach (var selectedId in selectedIdsInGroup)
                {
                    var mod = group.Modifiers.First(m => m.Id == selectedId);
                    modifiersPrice += mod.AdditionalPrice;

                    // Value Object olarak ekleme (Constructor yerine Init Property yapısı ile)
                    orderItemModifiers.Add(new OrderItemModifier
                    {
                        ModifierId = mod.Id,
                        Name = mod.Name,
                        AdditionalPrice = mod.AdditionalPrice
                    });
                }
            }

            decimal itemLineTotal = (itemBasePrice + modifiersPrice) * itemReq.Quantity;
            orderTotal += itemLineTotal;

            orderItems.Add(new OrderItem
            {
                MenuItemId = menuItem.Id,
                MenuItemNameSnapshot = menuItem.Name, // Raporlar ve fiş için o anki isim snapshot'ı
                Quantity = itemReq.Quantity,
                ItemTotal = itemLineTotal,
                SelectedModifiers = orderItemModifiers
            });
        }

        // 4. Order Entity'sini Oluştur
        var order = new Order
        {
            TableSessionId = session.Id,
            Status = OrderStatus.Received,
            Note = request.Note
        };

        // List<OrderItem> içindeki her elemanı navigation property üzerinden ekle
        order.OrderItems.AddRange(orderItems);

        // 5. Session Toplamını Güncelle
        session.TotalAmount += orderTotal;

        // PlaceOrderHandler'da _orderRepo yerine _unitOfWork.Repository<Order>() kullan
        await _unitOfWork.Repository<Order>().AddAsync(order, cancellationToken);
        _unitOfWork.Repository<TableSession>().Update(session);

        await _unitOfWork.SaveChangesAsync(cancellationToken);


        var orderDto = _mapper.Map<OrderDto>(order);

        await _orderNotificationService.NotifyNewOrderAsync(
            orderDto,
            request.TableNumber,
            cancellationToken);

        return orderDto;
    }
}

public class GetTableOrderHistoryHandler : IRequestHandler<GetTableOrderHistoryQuery, TableOrderHistoryDto>
{
    private readonly IQueryableRepository<TableSession> _queryableSessionRepo;
    private readonly IMapper _mapper;

    public GetTableOrderHistoryHandler(IQueryableRepository<TableSession> queryableSessionRepo, IMapper mapper)
    {
        _queryableSessionRepo = queryableSessionRepo;
        _mapper = mapper;
    }

    public async Task<TableOrderHistoryDto> Handle(GetTableOrderHistoryQuery query, CancellationToken cancellationToken)
    {
        var sessions = await _queryableSessionRepo.FindWithIncludesAsync(
            s => s.Table.TableNumber == query.TableNumber && s.ClosedAt == null,
           q => q.Include(s => s.Table)
      .Include(s => s.Orders)
          .ThenInclude(o => o.OrderItems)
          .ThenInclude(i => i.MenuItem),
            cancellationToken);

        var activeSession = sessions.FirstOrDefault();

        if (activeSession == null)
            throw new ValidationException(new Dictionary<string, string[]> { { "Table", new[] { "Bu masa için aktif bir oturum bulunmamaktadır." } } });

        var orderDtos = _mapper.Map<List<OrderDto>>(activeSession.Orders.OrderByDescending(o => o.CreatedAt));

        return new TableOrderHistoryDto(
            TableNumber: query.TableNumber,
            Orders: orderDtos,
            GrandTotal: activeSession.TotalAmount
        );
    }
}

public class UpdateOrderStatusHandler : IRequestHandler<UpdateOrderStatusCommand>
{
    private readonly IRepository<Order> _orderRepo;
    private readonly IUnitOfWork _unitOfWork;

    private readonly IOrderNotificationService _orderNotificationService;
    private readonly IQueryableRepository<Order> _queryableOrderRepo;
    public UpdateOrderStatusHandler(
      IRepository<Order> orderRepo,
      IUnitOfWork unitOfWork,
      IOrderNotificationService orderNotificationService,  // ← ekle
      IQueryableRepository<Order> queryableOrderRepo)      // ← ekle
    {
        _orderRepo = orderRepo;
        _unitOfWork = unitOfWork;
        _orderNotificationService = orderNotificationService;
        _queryableOrderRepo = queryableOrderRepo;
    }

    public async Task Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        var order = await _orderRepo.GetByIdAsync(command.OrderId, cancellationToken);

        if (order == null)
            throw new NotFoundException(nameof(Order), command.OrderId);

        order.Status = command.NewStatus;

        _orderRepo.Update(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // TODO: B3 görevinde IOrderNotificationService ile müşteriye/kasaya haber verilecek
        // tableNumber için Order → TableSession → Table join gerekiyor
        var orders = await _queryableOrderRepo.FindWithIncludesAsync(
            o => o.Id == command.OrderId,
            q => q.Include(o => o.TableSession).ThenInclude(s => s.Table),
            cancellationToken);

        var tableNumber = orders.FirstOrDefault()?.TableSession.Table.TableNumber ?? 0;

        await _orderNotificationService.NotifyOrderStatusChangedAsync(
            command.OrderId,
            tableNumber,
            command.NewStatus,
            cancellationToken);
    }
}

public class CallWaiterHandler : IRequestHandler<CallWaiterCommand>
{
    private readonly IRepository<Table> _tableRepo;
    private readonly IWaiterNotificationService _waiterNotificationService;

    public CallWaiterHandler(IRepository<Table> tableRepo, IWaiterNotificationService waiterNotificationService)
    {
        _tableRepo = tableRepo;
        _waiterNotificationService = waiterNotificationService;
    }

    public async Task Handle(CallWaiterCommand command, CancellationToken cancellationToken)
    {
        var tableExists = await _tableRepo.AnyAsync(t => t.TableNumber == command.Request.TableNumber && t.IsActive, cancellationToken);

        if (!tableExists)
            throw new ValidationException(new Dictionary<string, string[]> { { "Table", new[] { "Geçersiz veya pasif masa numarası." } } });

        await _waiterNotificationService.NotifyWaiterCalledAsync(command.Request.TableNumber, command.Request.Note, cancellationToken);
    }
}