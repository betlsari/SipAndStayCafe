using Microsoft.AspNetCore.Identity;

namespace SipAndStayCafe.Infrastructure.Persistence
{
    /// <summary>
    /// Extends the default Identity role.
    /// Role names: <c>Owner</c>, <c>Cashier</c>, <c>KitchenStaff</c>.
    /// </summary>
    public sealed class ApplicationRole : IdentityRole
    {
        public ApplicationRole() { }
        public ApplicationRole(string roleName) : base(roleName) { }
    }
}
