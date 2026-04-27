using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Application.DTOs.Table
{
    public sealed record TableDto(Guid Id, int TableNumber, string QRCodeUrl, bool IsActive);
    public sealed record CreateTableRequest(int TableNumber);
    public sealed record UpdateTableRequest(int TableNumber, bool IsActive);

    public sealed record TableSessionDto(Guid Id, Guid TableId, int TableNumber,
        DateTime OpenedAt, DateTime? ClosedAt, bool IsPaid,
        decimal TotalAmount, string PaymentMethod, string PaymentStatus);
}
