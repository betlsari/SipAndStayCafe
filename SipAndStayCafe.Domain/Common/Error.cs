namespace SipAndStayCafe.Domain.Common;

public sealed partial class Error
{
    public string Code { get; }
    public string Message { get; }

    private Error(string code, string message)
    {
        Code = code;
        Message = message;
    }

    public static Error Create(string code, string message) => new(code, message);

    public static readonly Error None = new(string.Empty, string.Empty);

    public static class General
    {
        public static Error NotFound(string entity) => Create("NotFound", $"{entity} not found.");
        public static Error Conflict(string message) => Create("Conflict", message);
        public static Error Unauthorized() => Create("Unauthorized", "You are not authorized.");
        public static Error Validation(string message) => Create("Validation", message);
        public static Error Unexpected() => Create("Unexpected", "An unexpected error occurred.");
    }
}