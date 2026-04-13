using Hangfire;
using SipAndStayCafe.Application;
using SipAndStayCafe.Infrastructure;
using SipAndStayCafe.Infrastructure.Jobs;
using SipAndStayCafe.Infrastructure.Seed;
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
app.UseHttpsRedirection();

// 4. CORS
app.UseCors("AllowReactDev");

// 5. Authentication → Authorization
app.UseAuthentication();
app.UseAuthorization();

// 6. Hangfire dashboard — pipeline kurulduktan SONRA
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter()]
});

// 7. Recurring jobs — UseHangfireDashboard'dan SONRA kayıt edilmeli
RecurringJob.AddOrUpdate<StockResetJob>(
    recurringJobId: "nightly-stock-reset",
    methodCall: job => job.ExecuteAsync(CancellationToken.None),
    cronExpression: Cron.Daily(0, 0),
    options: new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

// 8. Controllers
app.MapControllers();

// 9. SignalR hubs (ilerleyen görevlerde açılacak)
// app.MapHub<OrderHub>("/hubs/orders");
// app.MapHub<KitchenHub>("/hubs/kitchen");
// app.MapHub<CashierHub>("/hubs/cashier");

app.Run();