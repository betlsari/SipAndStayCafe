using FluentValidation;
using MediatR;
using ValidationException = SipAndStayCafe.Application.Exceptions.ValidationException;

namespace SipAndStayCafe.Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behavior that runs FluentValidation validators before
/// the request reaches its handler.
///
/// Flow: Request → ValidationBehaviour → Handler
///
/// If any validator fails, a <see cref="ValidationException"/> is thrown.
/// This is caught by <c>ExceptionHandlingMiddleware</c> in the API layer,
/// which converts it to a 400 Bad Request with the validation errors in the body.
///
/// If no validator is registered for a request type, the request passes through silently.
/// </summary>
public sealed class ValidationBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehaviour(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);

        // Run all validators in parallel
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count == 0)
            return await next();

        // Group errors by property name → matches ProblemDetails "errors" extension format
        var errors = failures
            .GroupBy(f => f.PropertyName, f => f.ErrorMessage)
            .ToDictionary(g => g.Key, g => g.ToArray());

        throw new ValidationException(errors);
    }
}