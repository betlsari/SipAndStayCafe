namespace SipAndStayCafe.Application.Exceptions;

public sealed class NotFoundException : Exception
{
    public NotFoundException(string entity, object key)
        : base($"{entity} with key '{key}' was not found.") { }

    public NotFoundException(string message)
        : base(message) { }
}
