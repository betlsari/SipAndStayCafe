using MediatR;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Common;
using SipAndStayCafe.Domain.Entities;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Application.Features.Payment;

public record IyzicoCallbackCommand(string Token) : IRequest<string>; // İşlem bitince müşterinin yönlendirileceği URL'i döneceğiz
public class IyzicoCallbackHandler : IRequestHandler<IyzicoCallbackCommand, string>
{
    private readonly IIyzicoService _iyzicoService;
    private readonly IRepository<TableSession> _sessionRepo;
    private readonly IRepository<PaymentTransaction> _transactionRepo;
    private readonly IPaymentNotificationService _paymentNotificationService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IQueryableRepository<TableSession> _queryableSessionRepo; // ← EKLENDİ

    public IyzicoCallbackHandler(
        IIyzicoService iyzicoService,
        IRepository<TableSession> sessionRepo,
        IRepository<PaymentTransaction> transactionRepo,
        IPaymentNotificationService paymentNotificationService,
        IUnitOfWork unitOfWork,
        IQueryableRepository<TableSession> queryableSessionRepo) // ← EKLENDİ
    {
        _iyzicoService = iyzicoService;
        _sessionRepo = sessionRepo;
        _transactionRepo = transactionRepo;
        _paymentNotificationService = paymentNotificationService;
        _unitOfWork = unitOfWork;
        _queryableSessionRepo = queryableSessionRepo; // ← EKLENDİ
    }

    public async Task<string> Handle(IyzicoCallbackCommand request, CancellationToken cancellationToken)
    {
        var checkoutForm = await _iyzicoService.RetrieveCheckoutFormAsync(request.Token);

        if (!Guid.TryParse(checkoutForm.ConversationId, out Guid transactionId))
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "Token", new[] { "Geçersiz işlem referansı." } }
            });

        var transaction = await _transactionRepo.GetByIdAsync(transactionId, cancellationToken);
        if (transaction == null)
            throw new NotFoundException(nameof(PaymentTransaction), transactionId);

        // ← DÜZELTME: Table navigation property dahil ediliyor
        var sessions = await _queryableSessionRepo.FindWithIncludesAsync(
            s => s.Id == transaction.TableSessionId,
            q => q.Include(s => s.Table),
            cancellationToken);

        var session = sessions.FirstOrDefault();
        if (session == null)
            throw new NotFoundException(nameof(TableSession), transaction.TableSessionId);

        // Duplicate webhook koruması
        if (transaction.Status != PaymentStatus.Pending)
            return $"/payment-result?status={transaction.Status.ToString().ToLower()}";

        if (checkoutForm.PaymentStatus == "SUCCESS")
        {
            transaction.Status = PaymentStatus.Completed;
            transaction.CompletedAt = DateTime.UtcNow;
            transaction.ProviderPaymentId = checkoutForm.PaymentId;
            session.Close();
        }
        else
        {
            transaction.Status = PaymentStatus.Failed;
            transaction.CompletedAt = DateTime.UtcNow;
            transaction.FailureReason = checkoutForm.ErrorMessage ?? "Bilinmeyen İyzico Hatası";
            session.MarkOnlinePaymentFailed();
        }

        _transactionRepo.Update(transaction);
        _sessionRepo.Update(session);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (checkoutForm.PaymentStatus == "SUCCESS")
        {
            // session.Table artık güvenle erişilebilir
            await _paymentNotificationService.NotifyTableSessionClosedAsync(
                session.Table.TableNumber, cancellationToken);
        }

        return $"/payment-result?status={(checkoutForm.PaymentStatus == "SUCCESS" ? "success" : "failed")}";
    }
}
// ==========================================
// KASİYERDE ÖDEME BAŞLATMA
// ==========================================
public record InitiateCashierPaymentCommand(Guid SessionId) : IRequest<Result<bool>>;

    public class InitiateCashierPaymentHandler : IRequestHandler<InitiateCashierPaymentCommand, Result<bool>>
    {
        private readonly IQueryableRepository<TableSession> _queryableSessionRepo;
        private readonly IRepository<TableSession> _sessionRepo;
        private readonly IPaymentNotificationService _paymentNotificationService;
        private readonly IUnitOfWork _unitOfWork;

        public InitiateCashierPaymentHandler(
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

        public async Task<Result<bool>> Handle(InitiateCashierPaymentCommand request, CancellationToken cancellationToken)
        {
            var session = await _queryableSessionRepo.GetByIdWithIncludesAsync(
                request.SessionId,
                q => q.Include(s => s.Table),
                cancellationToken);

            if (session == null)
                throw new NotFoundException(nameof(TableSession), request.SessionId);

            // Oturum zaten kapalıysa reddet
            if (session.IsPaid || session.ClosedAt.HasValue)
                return Result<bool>.Failure(Error.Create("Session.AlreadyClosed",
                    "Bu masa oturumu zaten kapatılmış."));

            // Domain metodu false dönerse başka bir ödeme yöntemi zaten kilitlenmiş demektir
            var locked = session.InitiateCashierPayment();
            if (!locked)
                return Result<bool>.Failure(Error.Create("Payment.AlreadyLocked",
                    $"Bu oturum için zaten '{session.PaymentMethod}' ödeme yöntemi başlatılmış. Çift ödeme engellenди."));

            _sessionRepo.Update(session);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _paymentNotificationService.NotifyTableWaitingForPaymentAsync(
                session.Table.TableNumber, session.TotalAmount, cancellationToken);

            return Result<bool>.Success(true);
        }
    }

    // ==========================================
    // ONLİNE ÖDEME BAŞLATMA (IYZICO)
    // ==========================================
    public record InitiateOnlinePaymentRequestDto(Guid SessionId, string CallbackBaseUrl);
    public record InitiateOnlinePaymentCommand(InitiateOnlinePaymentRequestDto Request) : IRequest<string>; // İyzico HTML Form içeriği döner

    public class InitiateOnlinePaymentHandler : IRequestHandler<InitiateOnlinePaymentCommand, string>
    {
        private readonly IQueryableRepository<TableSession> _queryableSessionRepo;
        private readonly IRepository<TableSession> _sessionRepo;
        private readonly IRepository<PaymentTransaction> _transactionRepo;
        private readonly IIyzicoService _iyzicoService;
        private readonly IUnitOfWork _unitOfWork;

        public InitiateOnlinePaymentHandler(
            IQueryableRepository<TableSession> queryableSessionRepo,
            IRepository<TableSession> sessionRepo,
            IRepository<PaymentTransaction> transactionRepo,
            IIyzicoService iyzicoService,
            IUnitOfWork unitOfWork)
        {
            _queryableSessionRepo = queryableSessionRepo;
            _sessionRepo = sessionRepo;
            _transactionRepo = transactionRepo;
            _iyzicoService = iyzicoService;
            _unitOfWork = unitOfWork;
        }

        public async Task<string> Handle(InitiateOnlinePaymentCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            var session = await _queryableSessionRepo.GetByIdWithIncludesAsync(
                req.SessionId,
                q => q.Include(s => s.Table),
                cancellationToken);

            if (session == null)
                throw new NotFoundException(nameof(TableSession), req.SessionId);

            // Oturum zaten kapalıysa reddet
            if (session.IsPaid || session.ClosedAt.HasValue)
                throw new ValidationException(new Dictionary<string, string[]>
        {
            { "Session", new[] { "Bu masa oturumu zaten kapatılmış." } }
        });

            // Domain metodu false dönerse başka bir ödeme yöntemi zaten kilitlenmiş demektir
            var locked = session.InitiateOnlinePayment();
            if (!locked)
                throw new ValidationException(new Dictionary<string, string[]>
        {
            { "Payment", new[] { $"Bu oturum için zaten '{session.PaymentMethod}' ödeme yöntemi başlatılmış. Çift ödeme engellendi." } }
        });

            // Transaction kaydı
            var transaction = new PaymentTransaction
            {
                TableSessionId = session.Id,
                Amount = session.TotalAmount,
                Provider = PaymentProvider.Iyzico,
                Status = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _transactionRepo.AddAsync(transaction, cancellationToken);
            _sessionRepo.Update(session);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var callbackUrl = $"{req.CallbackBaseUrl.TrimEnd('/')}/api/payment/iyzico/callback";
            var checkoutForm = await _iyzicoService.CreateCheckoutFormAsync(
                transaction.Id, session.TotalAmount, callbackUrl);

            if (checkoutForm.Status != "success")
            {
                session.MarkOnlinePaymentFailed();
                _sessionRepo.Update(session);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                throw new ValidationException(new Dictionary<string, string[]>
        {
            { "Iyzico", new[] { checkoutForm.ErrorMessage ?? "Ödeme altyapısı başlatılamadı." } }
        });
            }

            return checkoutForm.CheckoutFormContent;
        }
    }
