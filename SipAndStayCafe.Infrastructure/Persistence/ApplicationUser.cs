using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Infrastructure.Persistence
{

    public sealed class ApplicationUser : IdentityUser
    {
        /// <summary>Human-readable display name shown in the admin panel.</summary>
        public string DisplayName { get; set; } = string.Empty;
    }
}
