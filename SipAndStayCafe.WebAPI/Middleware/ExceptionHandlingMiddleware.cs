using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text.Json;
using SipAndStayCafe.Application.Exceptions;
using ValidationException = SipAndStayCafe.Application.Exceptions.ValidationException;

namespace SipAndStayCafe.WebAPI.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, errors) = exception switch
        {
            NotFoundException notFound => (
                HttpStatusCode.NotFound,
                "Resource Not Found",
                (object?)null
            ),
            ValidationException validation => (
                HttpStatusCode.BadRequest,
                "Validation Error",
                (object?)validation.Errors
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                (object?)null
            )
        };

        if (statusCode == HttpStatusCode.InternalServerError)
            _logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}", context.TraceIdentifier);
        else
            _logger.LogWarning(exception, "Handled exception. Type: {Type}, TraceId: {TraceId}",
                exception.GetType().Name, context.TraceIdentifier);

        var problem = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = exception.Message,
            Instance = context.Request.Path
        };

        problem.Extensions["traceId"] = context.TraceIdentifier;

        if (errors is not null)
            problem.Extensions["errors"] = errors;

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(problem, options));
    }
}