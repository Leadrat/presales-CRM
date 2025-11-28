using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Api;
using Microsoft.AspNetCore.Identity;
using Api.Services;
using Api.Options;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Api.Authorization;
using Api.Authorization.Requirements;

var builder = WebApplication.CreateBuilder(args);

// Configuration
var configuration = builder.Configuration;

// Services
builder.Services.AddControllers();

// OpenAPI
builder.Services.AddOpenApi();

// DbContext (PostgreSQL)
var connStr = configuration.GetConnectionString("Default");
if (!string.IsNullOrWhiteSpace(connStr))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connStr));
}

// JWT Authentication (HS256)
var jwtSecret = configuration["Jwt:Secret"] ?? string.Empty;
var issuer = configuration["Jwt:Issuer"];
var audience = configuration["Jwt:Audience"];
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret.PadRight(32)));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = !string.IsNullOrWhiteSpace(issuer),
            ValidIssuer = issuer,
            ValidateAudience = !string.IsNullOrWhiteSpace(audience),
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = ClaimTypes.Role
        };
    });

// Authorization & RBAC services
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.OwnedBy, policy =>
        policy.AddRequirements(new OwnershipRequirement()));
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuthorizationHandler, Api.Authorization.Handlers.OwnershipHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, Api.Authorization.CustomAuthorizationResultHandler>();

// CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// Application services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddScoped<ActivityLogService>();
builder.Services.AddScoped<ThemePreferenceService>();
builder.Services.AddScoped<IPasswordHasher<Api.Models.User>, PasswordHasher<Api.Models.User>>();
builder.Services.Configure<SignupOptions>(configuration.GetSection("Signup"));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseMiddleware<Api.Middleware.CorrelationIdMiddleware>();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();

app.Run();
