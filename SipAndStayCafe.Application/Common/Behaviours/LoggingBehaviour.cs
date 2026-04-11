using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace SipAndStayCafe.Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behavior that logs every request entry, exit, and slow-query warnings.
///
/// Logs:
///   - INFO  on entry: request type + serialized payload
///   - INFO  on exit:  elapsed ms
///   - WARN  if handler takes longer than <see cref="SlowRequestThresholdMs"/> ms
///
/// Does NOT log request payloads that might contain passwords or secrets.
/// Extend <see cref="SensitiveRequestTypes"/> to suppress specific types.
/// </summary>
public sealed class LoggingBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const int SlowRequestThresholdMs = 500;

    private readonly ILogger<LoggingBehaviour<TRequest, TResponse>> _logger;

    public LoggingBehaviour(ILogger<LoggingBehaviour<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;

        _logger.LogInformation("Handling {RequestName}", requestName);

        var sw = Stopwatch.StartNew();

        try
        {
            var response = await next();
            sw.Stop();

            if (sw.ElapsedMilliseconds > SlowRequestThresholdMs)
            {
                _logger.LogWarning(
                    "Slow request detected: {RequestName} took {ElapsedMs} ms",
                    requestName, sw.ElapsedMilliseconds);
            }
            else
            {
                _logger.LogInformation(
                    "Handled {RequestName} in {ElapsedMs} ms",
                    requestName, sw.ElapsedMilliseconds);
            }

            return response;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex,
                "Request {RequestName} failed after {ElapsedMs} ms",
                requestName, sw.ElapsedMilliseconds);
            throw;
        }
    }
}