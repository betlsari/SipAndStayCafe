using Hangfire;
using SipAndStayCafe.Application;
using SipAndStayCafe.Infrastructure;
using SipAndStayCafe.Infrastructure.Hangfire;
using SipAndStayCafe.Infrastructure.Jobs;
using SipAndStayCafe.Infrastructure.Seed;
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
// 3. Controllers + JSON options
// ────────────────────────────────────────────────────────────────────────────
builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ────────────────────────────────────────────────────────────────────────────
// 4. Swagger / OpenAPI
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
// 5. SignalR
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ────────────────────────────────────────────────────────────────────────────
// 6. CORS
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddCors(opts =>
{
    opts.AddPolicy("AllowReactDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
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
app.UseHttpsRedirection();

// 4. CORS — must be before auth
app.UseCors("AllowReactDev");

// 5. Authentication → Authorization (order matters)
app.UseAuthentication();
app.UseAuthorization();

// 6. Hangfire dashboard
// Dev  → localhost requests pass through OwnerHangfireAuthFilter unconditionally.
// Prod → requires an authenticated Owner-role JWT in the request.
// TODO (post-MVP): add cookie-based session so the owner can log in via the
//       admin panel and access the dashboard without a separate Bearer token.
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new OwnerHangfireAuthFilter()]
});

// 7. Recurring jobs — registered after UseHangfireDashboard
RecurringJob.AddOrUpdate<StockResetJob>(
    recurringJobId: "nightly-stock-reset",
    methodCall: job => job.ExecuteAsync(CancellationToken.None),
    cronExpression: Cron.Daily(0, 0),
    options: new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

RecurringJob.AddOrUpdate<WeeklyReportJob>(
    recurringJobId: "weekly-sales-report",
    methodCall: job => job.ExecuteAsync(CancellationToken.None),
    cronExpression: "0 0 * * 1",          // Her Pazartesi 00:00 UTC
    options: new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

// 8. Controllers
app.MapControllers();

// 9. SignalR hubs — uncomment as each hub is implemented
 app.MapHub<OrderHub>("/hubs/orders");
// app.MapHub<KitchenHub>("/hubs/kitchen");
app.MapHub<CashierHub>("/hubs/cashier");

app.Run();