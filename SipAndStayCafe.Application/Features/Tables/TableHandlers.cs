using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.DTOs.Table;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;

namespace SipAndStayCafe.Application.Features.Tables;

// ==========================================
// 1. QUERIES & COMMANDS
// ==========================================

public record GetAllTablesQuery() : IRequest<IReadOnlyList<TableDto>>;
public record GetTableByIdQuery(Guid Id) : IRequest<TableDto>;
public record CreateTableCommand(CreateTableRequest Dto, string BaseUrl) : IRequest<TableDto>;
public record UpdateTableCommand(Guid Id, UpdateTableRequest Dto) : IRequest<TableDto>;
public record DeleteTableCommand(Guid Id) : IRequest;
public record GetActiveTableSessionQuery(Guid TableId) : IRequest<TableSessionDto?>;
public record OpenTableSessionCommand(Guid TableId) : IRequest<TableSessionDto>;
public record CloseTableSessionCommand(Guid SessionId) : IRequest<Result<bool>>;

// ==========================================
// 2. HANDLERS
// ==========================================

public class GetAllTablesHandler : IRequestHandler<GetAllTablesQuery, IReadOnlyList<TableDto>>
{
    private readonly IRepository<Table> _tableRepository;
    private readonly IMapper _mapper;

    public GetAllTablesHandler(IRepository<Table> tableRepository, IMapper mapper)
    {
        _tableRepository = tableRepository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<TableDto>> Handle(GetAllTablesQuery request, CancellationToken cancellationToken)
    {
        var tables = await _tableRepository.GetAllAsync(cancellationToken);
        return _mapper.Map<IReadOnlyList<TableDto>>(tables);
    }
}

public class GetTableByIdHandler : IRequestHandler<GetTableByIdQuery, TableDto>
{
    private readonly IRepository<Table> _tableRepository;
    private readonly IMapper _mapper;

    public GetTableByIdHandler(IRepository<Table> tableRepository, IMapper mapper)
    {
        _tableRepository = tableRepository;
        _mapper = mapper;
    }

    public async Task<TableDto> Handle(GetTableByIdQuery request, CancellationToken cancellationToken)
    {
        var table = await _tableRepository.GetByIdAsync(request.Id, cancellationToken);
        if (table == null)
            throw new NotFoundException(nameof(Table), request.Id);

        return _mapper.Map<TableDto>(table);
    }
}

public class CreateTableHandler : IRequestHandler<CreateTableCommand, TableDto>
{
    private readonly IRepository<Table> _tableRepository;
    private readonly IQrCodeService _qrCodeService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateTableHandler(
        IRepository<Table> tableRepository,
        IQrCodeService qrCodeService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _tableRepository = tableRepository;
        _qrCodeService = qrCodeService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<TableDto> Handle(CreateTableCommand request, CancellationToken cancellationToken)
    {
        // TableNumber unique kontrolü
        var isExists = await _tableRepository.AnyAsync(t => t.TableNumber == request.Dto.TableNumber, cancellationToken);

        if (isExists)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "TableNumber", new[] { "Bu masa numarası zaten kullanılmaktadır." } }
            });
        }

        var qrCodeUrl = _qrCodeService.GenerateQrCodeUrl(request.Dto.TableNumber, request.BaseUrl);

        var table = new Table
        {
            TableNumber = request.Dto.TableNumber,
            QRCodeUrl = qrCodeUrl,
            IsActive = true
        };

        await _tableRepository.AddAsync(table, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<TableDto>(table);
    }
}

public class UpdateTableHandler : IRequestHandler<UpdateTableCommand, TableDto>
{
    private readonly IRepository<Table> _tableRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateTableHandler(IRepository<Table> tableRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _tableRepository = tableRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<TableDto> Handle(UpdateTableCommand request, CancellationToken cancellationToken)
    {
        var table = await _tableRepository.GetByIdAsync(request.Id, cancellationToken);
        if (table == null)
            throw new NotFoundException(nameof(Table), request.Id);

        if (table.TableNumber != request.Dto.TableNumber)
        {
            var isExists = await _tableRepository.AnyAsync(t => t.TableNumber == request.Dto.TableNumber && t.Id != request.Id, cancellationToken);

            if (isExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "TableNumber", new[] { "Bu masa numarası zaten kullanılmaktadır." } }
                });
            }

            table.TableNumber = request.Dto.TableNumber;
        }

        table.IsActive = request.Dto.IsActive;

        _tableRepository.Update(table);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<TableDto>(table);
    }
}

public class DeleteTableHandler : IRequestHandler<DeleteTableCommand>
{
    private readonly IRepository<Table> _tableRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteTableHandler(IRepository<Table> tableRepository, IUnitOfWork unitOfWork)
    {
        _tableRepository = tableRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteTableCommand request, CancellationToken cancellationToken)
    {
        var table = await _tableRepository.GetByIdAsync(request.Id, cancellationToken);
        if (table == null)
            throw new NotFoundException(nameof(Table), request.Id);

        _tableRepository.Remove(table);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

public class GetActiveTableSessionHandler : IRequestHandler<GetActiveTableSessionQuery, TableSessionDto?>
{
    private readonly IQueryableRepository<TableSession> _queryableSessionRepository;
    private readonly IMapper _mapper;

    public GetActiveTableSessionHandler(IQueryableRepository<TableSession> queryableSessionRepository, IMapper mapper)
    {
        _queryableSessionRepository = queryableSessionRepository;
        _mapper = mapper;
    }

    public async Task<TableSessionDto?> Handle(GetActiveTableSessionQuery request, CancellationToken cancellationToken)
    {
        var sessions = await _queryableSessionRepository.FindWithIncludesAsync(
            s => s.TableId == request.TableId && s.ClosedAt == null,
            q => q.Include(s => s.Table),
            cancellationToken);

        var activeSession = sessions.FirstOrDefault();

        return activeSession == null ? null : _mapper.Map<TableSessionDto>(activeSession);
    }
}

public class OpenTableSessionHandler : IRequestHandler<OpenTableSessionCommand, TableSessionDto>
{
    private readonly IRepository<Table> _tableRepository;
    private readonly IRepository<TableSession> _sessionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public OpenTableSessionHandler(
        IRepository<Table> tableRepository,
        IRepository<TableSession> sessionRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _tableRepository = tableRepository;
        _sessionRepository = sessionRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<TableSessionDto> Handle(OpenTableSessionCommand request, CancellationToken cancellationToken)
    {
        var table = await _tableRepository.GetByIdAsync(request.TableId, cancellationToken);
        if (table == null)
            throw new NotFoundException(nameof(Table), request.TableId);

        var hasActiveSession = await _sessionRepository.AnyAsync(s => s.TableId == request.TableId && s.ClosedAt == null, cancellationToken);

        if (hasActiveSession)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "TableId", new[] { "Bu masa için zaten açık bir oturum bulunmaktadır." } }
            });
        }

        var session = new TableSession
        {
            TableId = request.TableId,
            OpenedAt = DateTime.UtcNow,
            TotalAmount = 0m
        };

        await _sessionRepository.AddAsync(session, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        session.Table = table;

        return _mapper.Map<TableSessionDto>(session);
    }
}

public class CloseTableSessionHandler : IRequestHandler<CloseTableSessionCommand, Result<bool>>
{
    private readonly IRepository<TableSession> _sessionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CloseTableSessionHandler(IRepository<TableSession> sessionRepository, IUnitOfWork unitOfWork)
    {
        _sessionRepository = sessionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(CloseTableSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await _sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session == null)
            return Result<bool>.Failure(Error.Create("Session.NotFound", "Belirtilen masa oturumu bulunamadı."));

        if (session.ClosedAt.HasValue)
            return Result<bool>.Failure(Error.Create("Session.AlreadyClosed", "Bu oturum zaten sonlandırılmış."));

        // Entity içindeki domain metodunu kullanarak kapatıyoruz (IsPaid, PaymentStatus ve ClosedAt ayarlanır)
        session.Close();

        _sessionRepository.Update(session);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}