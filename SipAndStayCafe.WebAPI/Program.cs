using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SipAndStayCafe.Infrastructure;
using SipAndStayCafe.WebAPI.Middleware;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services
    .AddAuthentication()
    .AddJwtBearer();

builder.Services.AddAuthorization();

var app = builder.Build();
app.UseMiddleware<ExceptionHandlingMiddleware>();


// Configure the HTTP request pipeline.

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Apply pending EF Core migrations automatically in development only.
    // In staging/production, run migrations as a pre-deploy step (dotnet ef database update).
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SipAndStayCafe.Infrastructure.Persistence.AppDbContext>();
    await db.Database.MigrateAsync();
}
app.UseHttpsRedirection();

app.UseAuthorization();

// Authentication must come before Authorization.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SignalR hub endpoints — paths will be registered here as hubs are built.
// app.MapHub<OrderHub>("/hubs/orders");
// app.MapHub<PaymentHub>("/hubs/payments");

app.Run();
