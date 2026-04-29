using Microsoft.EntityFrameworkCore;
using api_dotnet.Data;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

//  Puerto
builder.WebHost.UseUrls("http://*:5000");



// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


var redisConnectionString = builder.Configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";

// Configurar CORS para permitir solicitudes desde el frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")  // URL del frontend
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = ConfigurationOptions.Parse(redisConnectionString);
    configuration.AbortOnConnectFail = false; 
    return ConnectionMultiplexer.Connect(configuration);
});



var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.Migrate();  //  Aplicar migraciones de la base de datos al iniciar la aplicación.
}


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();