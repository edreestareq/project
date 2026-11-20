using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Infrastructure.Data;
using AspnetStarterApp.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Infrastructure: Database (SQLite 3NF Schema)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=karajak.db";
builder.Services.AddDbContext<KarajakDbContext>(options =>
    options.UseSqlite(connectionString));

// 2. Application -> Infrastructure Dependency Injection
builder.Services.AddHttpClient<IAiService, GeminiAiService>();
builder.Services.AddScoped<IAiQueryService, AiQueryService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICarService, CarService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IReportService, ReportService>();

// 3. Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "KARAJAK_SUPER_SECRET_SECURITY_KEY_2026_AUTOMART_AI_AMMAN_JORDAN_UNIVERSITY";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// 4. Add Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// 5. CORS for API access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 6. Ensure Database Created and Seeded with Thesis Mockup Data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<KarajakDbContext>();
    DbInitializer.Initialize(context);
}

// 7. Middlewares
app.UseCors("AllowAll");

// Serve Default Files (auth-portal.html as landing page) and Static Assets from wwwroot
var defaultFilesOptions = new DefaultFilesOptions();
defaultFilesOptions.DefaultFileNames.Clear();
defaultFilesOptions.DefaultFileNames.Add("auth-portal.html");
app.UseDefaultFiles(defaultFilesOptions);
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback to auth-portal.html for Entry Navigation
app.MapFallbackToFile("auth-portal.html");

app.Run();
