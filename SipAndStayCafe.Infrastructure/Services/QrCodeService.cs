using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using QRCoder;
using SipAndStayCafe.Application.Interfaces;

namespace SipAndStayCafe.Infrastructure.Services
{
   

    public sealed class QrCodeService : IQrCodeService
    {
        public string GenerateQrCodeUrl(int tableNumber, string baseUrl)
            => $"{baseUrl.TrimEnd('/')}/menu?table={tableNumber}";

        public byte[] GenerateQrCodeImage(string url)
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrData);
            return qrCode.GetGraphic(20);
        }
    }
}
