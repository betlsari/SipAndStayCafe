using MediatR;
using SipAndStayCafe.Application.Exceptions;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Domain.Entities;
using SipAndStayCafe.Domain.Enums;

namespace SipAndStayCafe.Application.Features.Payment;

public record IyzicoCallbackCommand(string Token) : IRequest<string>; // İşlem bitince müşterinin yönlendirileceği URL'i döneceğiz

public class IyzicoCallbackHandler : IRequestHandler<IyzicoCallbackCommand, string>
{
    private readonly IIyzicoService _iyzicoService;
    private readonly IRepository<TableSession> _sessionRepo;
    private readonly IRepository<PaymentTransaction> _transactionRepo;
    private readonly IPaymentNotificationService _paymentNotificationService; // SignalR için (Daha sonra eklenecek)
    private readonly IUnitOfWork _unitOfWork;

    public IyzicoCallbackHandler(
        IIyzicoService iyzicoService,
        IRepository<TableSession> sessionRepo,
        IRepository<PaymentTransaction> transactionRepo,
        IPaymentNotificationService paymentNotificationService,
        IUnitOfWork unitOfWork)
    {
        _iyzicoService = iyzicoService;
        _sessionRepo = sessionRepo;
        _transactionRepo = transactionRepo;
        _paymentNotificationService = paymentNotificationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<string> Handle(IyzicoCallbackCommand request, CancellationToken cancellationToken)
    {
        // 1. İyzico'dan gelen token ile ödemenin sonucunu sorgula
        var checkoutForm = await _iyzicoService.RetrieveCheckoutFormAsync(request.Token);

        // İyzico'ya gönderdiğimiz ConversationId, bizim veritabanımızdaki Transaction ID'sine denk geliyor
        if (!Guid.TryParse(checkoutForm.ConversationId, out Guid transactionId))
            throw new ValidationException(new Dictionary<string, string[]> { { "Token", new[] { "Geçersiz işlem referansı." } } });
        // 2. İşlemi ve bağlı olduğu masayı bul
        var transaction = await _transactionRepo.GetByIdAsync(transactionId, cancellationToken);
        if (transaction == null)
            throw new NotFoundException(nameof(PaymentTransaction), transactionId);

        // Include ile Table verisini de getiriyoruz ki Notification servise TableNumber atabilelim
        var session = await _sessionRepo.Query()
            .Include(s => s.Table)
            .FirstOrDefaultAsync(s => s.Id == transaction.TableSessionId, cancellationToken);

        if (session == null)
            throw new NotFoundException(nameof(TableSession), transaction.TableSessionId);
        // 3. Duplicate (Çift) Webhook Koruması (İdempotency)
        // Eğer bu transaction zaten tamamlanmışsa, işlemi tekrar etmeden direkt başarılı kabul edip dönüyoruz
        if (transaction.Status != PaymentStatus.Pending)
        {
            return $"/payment-result?status={transaction.Status.ToString().ToLower()}";
        }

        // 4. İyzico'dan dönen sonucu işle
        if (checkoutForm.PaymentStatus == "SUCCESS")
        {
            // Başarılı ödeme
            transaction.Status = PaymentStatus.Completed;
            transaction.CompletedAt = DateTime.UtcNow;
            transaction.ProviderPaymentId = checkoutForm.PaymentId;

            session.Close(); // Entity içindeki Kapsüllü ve Idempotent metod
        }
        else
        {
            // Başarısız ödeme
            transaction.Status = PaymentStatus.Failed;
            transaction.CompletedAt = DateTime.UtcNow;
            transaction.FailureReason = checkoutForm.ErrorMessage ?? "Bilinmeyen İyzico Hatası";

            session.MarkOnlinePaymentFailed(); // Kilit açılır, müşteri tekrar deneyebilir
        }

        _transactionRepo.Update(transaction);
        _sessionRepo.Update(session);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 5. Kasiyere bildirim gönder (Başarılı ise kasiyer ekranında otomatik düşmesi için)
        // 5. Kasiyere bildirim gönder (Başarılı ise kasiyer ekranında otomatik düşmesi için)
        if (checkoutForm.PaymentStatus == "SUCCESS")
        {
            // Metot adı NotifyTableSessionClosedAsync olarak düzeltildi ve TableNumber gönderiliyor
            await _paymentNotificationService.NotifyTableSessionClosedAsync(session.Table.TableNumber, cancellationToken);
        }
        // 6. Müşteriyi Frontend'deki sonuç sayfasına yönlendir
        // Not: "/payment-result" senin React frontend'indeki route olmalıdır.
        return $"/payment-result?status={(checkoutForm.PaymentStatus == "SUCCESS" ? "success" : "failed")}";
    }
}