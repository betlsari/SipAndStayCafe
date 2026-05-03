using Hangfire;
using SipAndStayCafe.Application;
using SipAndStayCafe.Application.Interfaces.Hubs;
using SipAndStayCafe.Infrastructure;
using SipAndStayCafe.Infrastructure.Hangfire;
using SipAndStayCafe.Infrastructure.Jobs;
using SipAndStayCafe.Infrastructure.Seed;
using SipAndStayCafe.WebAPI.Adapters;
using SipAndStayCafe.WebAPI.Hubs;
using SipAndStayCafe.WebAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ────────────────────────────────────────────────────────────────────────────
// 1. Application layer (MediatR, FluentValidation, AutoMapper)
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddApplication();

// ────────────────────────────────────────────────────────────────────────────
// 2. Infrastructure layer (EF Core, Identity, JWT, Redis, Hangfire)
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ────────────────────────────────────────────────────────────────────────────
// 3. Hub proxy adapter'ları — WebAPI katmanında kayıt zorunlu.
//
//    IOrderHubContext  → OrderHubContextAdapter  (IHubContext<OrderHub> kullanır)
//    ICashierHubContext → CashierHubContextAdapter (IHubContext<CashierHub> kullanır)
//
//    Bu kayıtlar Infrastructure.DependencyInjection'da YAPILMAZ çünkü
//    OrderHub / CashierHub WebAPI katmanında tanımlı; Infrastructure bu tipleri
//    bilmez ve bilmemeli (Clean Architecture).
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IOrderHubContext, OrderHubContextAdapter>();
builder.Services.AddScoped<ICashierHubContext, CashierHubContextAdapter>();

// ────────────────────────────────────────────────────────────────────────────
// 4. Controllers + JSON options
// ────────────────────────────────────────────────────────────────────────────
builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ────────────────────────────────────────────────────────────────────────────
// 5. Swagger / OpenAPI
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new() { Title = "SipAndStay Cafe API", Version = "v1" });

    opts.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token. Example: Bearer eyJhbG..."
    });

    opts.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ────────────────────────────────────────────────────────────────────────────
// 6. SignalR
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ────────────────────────────────────────────────────────────────────────────
// 7. CORS
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddCors(opts =>
{
    opts.AddPolicy("AllowReactDev", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",  // Vite bazen bu portu da kullanır
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ────────────────────────────────────────────────────────────────────────────
// BUILD
// ────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ────────────────────────────────────────────────────────────────────────────
// Seed roles and initial owner account
// ────────────────────────────────────────────────────────────────────────────
await RoleSeeder.SeedAsync(app);

// ────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE PIPELINE
// ────────────────────────────────────────────────────────────────────────────

// 1. Global exception handler — must be first
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 2. Development tools
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(opts =>
    {
        opts.SwaggerEndpoint("/swagger/v1/swagger.json", "SipAndStay Cafe API v1");
        opts.RoutePrefix = "swagger";
    });
}

// 3. HTTPS redirect
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 4. CORS — must be before auth
app.UseCors("AllowReactDev");

// 5. Authentication → Authorization
app.UseAuthentication();
app.UseAuthorization();

// 6. Hangfire dashboard
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new OwnerHangfireAuthFilter()]
});

// 7. Recurring jobs
RecurringJob.AddOrUpdate<StockResetJob>(
    recurringJobId: "nightly-stock-reset",
    methodCall: job => job.ExecuteAsync(CancellationToken.None),
    cronExpression: Cron.Daily(0, 0),
    options: new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

RecurringJob.AddOrUpdate<WeeklyReportJob>(
    recurringJobId: "weekly-sales-report",
    methodCall: job => job.ExecuteAsync(CancellationToken.None),
    cronExpression: "0 0 * * 1",
    options: new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

// 8. Controllers
app.MapControllers();

// 9. SignalR hubs
app.MapHub<OrderHub>("/hubs/orders");
app.MapHub<CashierHub>("/hubs/cashier");

app.Run();