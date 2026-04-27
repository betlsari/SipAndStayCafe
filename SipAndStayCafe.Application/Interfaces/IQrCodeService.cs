using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Application.Interfaces
{
    public interface IQrCodeService
    {
        string GenerateQrCodeUrl(int tableNumber, string baseUrl);
        byte[] GenerateQrCodeImage(string url);
    }
}
