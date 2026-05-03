using Hangfire;
using SipAndStayCafe.Application;
using SipAndStayCafe.Application.Interfaces;
using SipAndStayCafe.Application.Interfaces.Hubs;

using SipAndStayCafe.Infrastructure;
using SipAndStayCafe.Infrastructure.Hangfire;
using SipAndStayCafe.Infrastructure.Jobs;
using SipAndStayCafe.Infrastructure.Persistence;
using SipAndStayCafe.Infrastructure.Persistence.Repositories;
using SipAndStayCafe.Infrastructure.Services;

using SipAndStayCafe.WebAPI.Adapters;
using SipAndStayCafe.WebAPI.Hubs;
using SipAndStayCafe.WebAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ── Layers ─────────────────────────────────────────────────────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// ── Hub Adapters ───────────────────────────────────────────────
builder.Services.AddScoped<IOrderHubContext, OrderHubContextAdapter>();
builder.Services.AddScoped<ICashierHubContext, CashierHubContextAdapter>();

// ── Application Services ───────────────────────────────────────

builder.Services.AddScoped<IIyzicoService, IyzicoService>();


// ── Unit of Work ───────────────────────────────────────────────
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ── Controllers ────────────────────────────────────────────────
builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ── Swagger ────────────────────────────────────────────────────
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

// ── SignalR ────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ── CORS ───────────────────────────────────────────────────────
builder.Services.AddCors(opts =>
{
    opts.AddPolicy("AllowReactDev", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// ❌ BURAYI SİLDİK (çünkü sende yoktu)
// await RoleSeeder.SeedAsync(app);

// ── Middleware ─────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(opts =>
    {
        opts.SwaggerEndpoint("/swagger/v1/swagger.json", "SipAndStay Cafe API v1");
        opts.RoutePrefix = "swagger";
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowReactDev");

app.UseAuthentication();
app.UseAuthorization();

// ── Hangfire ───────────────────────────────────────────────────
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new OwnerHangfireAuthFilter()]
});

RecurringJob.AddOrUpdate<StockResetJob>(
    "nightly-stock-reset",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Daily(0, 0),
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

RecurringJob.AddOrUpdate<WeeklyReportJob>(
    "weekly-sales-report",
    job => job.ExecuteAsync(CancellationToken.None),
    "0 0 * * 1",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

// ── Endpoints ──────────────────────────────────────────────────
app.MapControllers();

app.MapHub<OrderHub>("/hubs/orders").AllowAnonymous();
app.MapHub<CashierHub>("/hubs/cashier");

app.Run();