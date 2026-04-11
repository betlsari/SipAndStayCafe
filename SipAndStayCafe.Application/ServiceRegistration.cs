using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using SipAndStayCafe.Application.Common.Behaviours;
using System.Reflection;

namespace SipAndStayCafe.Application;

/// <summary>
/// Registers all Application-layer services into the DI container.
/// Call this from Program.cs: builder.Services.AddApplication();
/// </summary>
public static class ServiceRegistration
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // MediatR — scans this assembly for IRequestHandler<,> implementations
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);

            // Pipeline behaviors run in registration order (outermost first)
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehaviour<,>));
        });

        // FluentValidation — scans this assembly for AbstractValidator<T> implementations
        services.AddValidatorsFromAssembly(assembly);

        // AutoMapper — scans this assembly for Profile subclasses
        services.AddAutoMapper(cfg => cfg.AddMaps(assembly));

        return services;
    }
}