using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Domain.Enums
{
    public enum OrderStatus
    {
        /// <summary>Order has been received by the system and is visible on the kitchen screen.</summary>
        Received = 0,

        /// <summary>Kitchen staff have acknowledged the order and are preparing it.</summary>
        BeingPrepared = 1,

        /// <summary>The order is ready for the customer to collect or be served.</summary>
        Ready = 2
    }
}
