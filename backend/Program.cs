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
using dotenv.net;

DotEnv.Load();
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

// Authorization & RBAC
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
var frontendOrigin = configuration["FRONTEND_ORIGIN"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy
            // In development, allow any origin so Docker and local hosts both work
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// App services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddScoped<ActivityLogService>();
builder.Services.AddScoped<ThemePreferenceService>();
builder.Services.AddScoped<IPasswordHasher<Api.Models.User>, PasswordHasher<Api.Models.User>>();
builder.Services.Configure<SignupOptions>(configuration.GetSection("Signup"));

var app = builder.Build();

// HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    // Only OpenAPI mappings
    app.MapOpenApi();

    // ❌ IMPORTANT: Do NOT enable HTTPS redirect in Dev
    // because Dev has no HTTPS endpoint configured
}
else
{
    // ✔ Enable HTTPS redirect ONLY in Production
    app.UseHttpsRedirection();
}

app.UseMiddleware<Api.Middleware.CorrelationIdMiddleware>();
app.UseCors("Frontend");
app.UseAuthentication();

// Guard: block inactive or deleted users
app.Use(async (context, next) =>
{
    if (context.User?.Identity?.IsAuthenticated == true)
    {
        var userIdStr = context.User.FindFirst("sub")?.Value
            ?? context.User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (Guid.TryParse(userIdStr, out var userId))
        {
            using var scope = context.RequestServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var active = await db.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == userId && u.IsActive && !u.IsDeleted);

            if (!active)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = new
                    {
                        code = "USER_INACTIVE",
                        message = "User is inactive"
                    }
                });
                return;
            }
        }
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();

// Seed default CRM providers if they are missing
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        if (db.Database.CanConnect())
        {
            var existingNames = new HashSet<string>(
                db.CrmProviders.Select(p => p.Name).ToList(),
                StringComparer.OrdinalIgnoreCase);

            var defaultCrms = new[]
            {
                "Salesforce",
                "HubSpot",
                "Zoho CRM",
                "Pipedrive",
                "Freshsales",
                "Microsoft Dynamics 365",
                "Insightly",
                "SugarCRM",
                "Close",
                "Monday Sales CRM",
                "Copper",
                "None"
            };

            var maxOrder = db.CrmProviders.Any() ? db.CrmProviders.Max(p => p.DisplayOrder) : 0;

            foreach (var name in defaultCrms)
            {
                if (!existingNames.Contains(name))
                {
                    maxOrder++;
                    db.CrmProviders.Add(new Api.Models.CrmProvider
                    {
                        Id = Guid.NewGuid(),
                        Name = name,
                        DisplayOrder = maxOrder
                    });
                }
            }

            if (db.ChangeTracker.HasChanges())
            {
                db.SaveChanges();
            }
        }
    }
    catch
    {
        // Best-effort seed only; ignore failures during startup
    }
}

app.Run();
