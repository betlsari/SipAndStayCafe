using Hangfire;
using SipAndStayCafe.Application;
using SipAndStayCafe.Infrastructure;
using SipAndStayCafe.Infrastructure.Seed;
using SipAndStayCafe.WebAPI.Middleware;
using Microsoft.EntityFrameworkCore;
using SipAndStayCafe.Infrastructure.Persistence;

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
        // Serialize enum values as strings in JSON responses (e.g. "Received" not 0)
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

    // Add JWT Bearer support to Swagger UI
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
// 6. CORS — allow React dev server in development
// ────────────────────────────────────────────────────────────────────────────
builder.Services.AddCors(opts =>
{
    opts.AddPolicy("AllowReactDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173") // Vite default port
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // required for SignalR
    });
});

// ────────────────────────────────────────────────────────────────────────────
// BUILD
// ────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ────────────────────────────────────────────────────────────────────────────
// Seed roles and initial owner account
// Runs BEFORE the app starts accepting requests.
// Safe to run on every startup — idempotent.
// RoleSeeder.SeedAsync(app)'den önce :
//using (var scope = app.Services.CreateScope())
//{
//    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//    await db.Database.MigrateAsync();
//}
// ────────────────────────────────────────────────────────────────────────────
// await RoleSeeder.SeedAsync(app);

// ────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE PIPELINE
// Order matters — add middleware top to bottom in the correct sequence.
// ────────────────────────────────────────────────────────────────────────────

// 1. Global exception handler (must be first — wraps everything below)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 2. Development-only tools
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

// 4. CORS (must be before Authentication/Authorization)
app.UseCors("AllowReactDev");

// 5. Authentication → Authorization (order is mandatory)
app.UseAuthentication();
app.UseAuthorization();

// 6. Hangfire dashboard (Owner-only in production — protected by auth policy)
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    // TODO: Replace with a proper authorization filter once auth is fully wired
    // For now, dashboard is only exposed in Development
    Authorization = app.Environment.IsDevelopment()
        ? [new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter()]
        : [new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter()]
});

// 7. Controllers
app.MapControllers();

// 8. SignalR hubs (will be added as hubs are implemented)
// app.MapHub<OrderHub>("/hubs/orders");
// app.MapHub<KitchenHub>("/hubs/kitchen");
// app.MapHub<CashierHub>("/hubs/cashier");

app.Run();