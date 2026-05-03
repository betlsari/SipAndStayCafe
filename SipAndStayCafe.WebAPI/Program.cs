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

builder.Services.AddApplication();

builder.Services.AddInfrastructure(builder.Configuration);
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddScoped<IOrderHubContext, OrderHubContextAdapter>();
builder.Services.AddScoped<ICashierHubContext, CashierHubContextAdapter>();

builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

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

builder.Services.AddSignalR();

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

await RoleSeeder.SeedAsync(app);

// 1. Global exception handler
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

// 4. CORS — auth'dan önce olmalı
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
// OrderHub: müşteriler anonymous bağlanabilmeli → AllowAnonymous zorunlu
app.MapHub<OrderHub>("/hubs/orders").AllowAnonymous();
// CashierHub: sadece staff erişir → token gerekli
app.MapHub<CashierHub>("/hubs/cashier");

app.Run();