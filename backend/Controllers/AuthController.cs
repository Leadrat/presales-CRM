using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Api.Options;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _hasher;
    private readonly JwtService _jwt;
    private readonly RefreshTokenService _refresh;
    private readonly IConfiguration _config;
    private readonly IOptions<SignupOptions> _signupOptions;
    private readonly ActivityLogService _activity;

    public AuthController(AppDbContext db, IPasswordHasher<User> hasher, JwtService jwt, RefreshTokenService refresh, IConfiguration config, ActivityLogService activity, IOptions<SignupOptions> signupOptions)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _refresh = refresh;
        _config = config;
        _activity = activity;
        _signupOptions = signupOptions;
    }

    public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
    public record LoginResponse(string AccessToken, string RefreshToken, object User);
    public record RefreshRequest([Required] string RefreshToken);
    public record SignupRequest([Required] string FullName, [Required, EmailAddress] string Email, [Required] string Password, string? Phone);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !user.IsActive)
        {
            await _activity.LogAsync(null, "Auth", null, "LoginFailed", $"Login failed for {request.Email}", TryCorrelationId());
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Invalid credentials" } });
        }
        // Prefer Identity hasher; only attempt BCrypt if hash appears to be BCrypt ($2*)
        var identityResult = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        var verify = identityResult == PasswordVerificationResult.Success || identityResult == PasswordVerificationResult.SuccessRehashNeeded;
        if (!verify && user.PasswordHash.StartsWith("$2"))
        {
            // Backward-compat for any legacy BCrypt hashes
            verify = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        }
        if (!verify)
        {
            await _activity.LogAsync(user.Id, "Auth", user.Id, "LoginFailed", "Invalid password", TryCorrelationId());
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Invalid credentials" } });
        }

        // Resolve role name for JWT and response
        var roleName = await _db.Roles.AsNoTracking()
            .Where(r => r.Id == user.RoleId)
            .Select(r => r.Name)
            .FirstOrDefaultAsync() ?? "Basic";

        var (accessToken, _) = _jwt.CreateAccessToken(user.Id, user.Email, user.RoleId, roleName);

        var refreshTokenRaw = _refresh.GenerateToken();
        var refreshTokenHash = _refresh.Hash(refreshTokenRaw);
        var days = int.TryParse(_config["Jwt:RefreshDays"], out var d) ? d : 7;
        var rt = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(days),
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.RefreshTokens.Add(rt);
        await _db.SaveChangesAsync();
        await _activity.LogAsync(user.Id, "Auth", user.Id, "Authenticated", "Login success", TryCorrelationId());

        var userDto = new { id = user.Id, email = user.Email, role = roleName };
        return Ok(new { data = new LoginResponse(accessToken, refreshTokenRaw, userDto) });
    }

    [HttpPost("signup")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> Signup([FromBody] SignupRequest request)
    {
        // Normalize email to lowercase
        var email = request.Email.Trim().ToLowerInvariant();

        // Enforce domain allowlist from configuration
        var domains = _signupOptions.Value.GetDomains();
        if (domains == null || domains.Count == 0)
        {
            return StatusCode(403, new { error = new { code = "DOMAIN_NOT_ALLOWED", message = "Signup is restricted" } });
        }
        var atIdx = email.LastIndexOf('@');
        var domain = atIdx >= 0 ? email[(atIdx + 1)..] : string.Empty;
        if (string.IsNullOrEmpty(domain) || !domains.Contains(domain))
        {
            return StatusCode(403, new { error = new { code = "DOMAIN_NOT_ALLOWED", message = "Email domain not allowed" } });
        }

        // Enforce password policy: min 8 chars, at least 1 letter and 1 number
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8 ||
            !request.Password.Any(char.IsLetter) || !request.Password.Any(char.IsDigit))
        {
            return BadRequest(new { error = new { code = "WEAK_PASSWORD", message = "Password must be at least 8 characters and include a letter and a number" } });
        }

        // Duplicate check among non-deleted users (case-insensitive)
        var exists = await _db.Users.AsNoTracking()
            .AnyAsync(u => !u.IsDeleted && u.Email.ToLower() == email);
        if (exists)
        {
            return Conflict(new { error = new { code = "EMAIL_EXISTS", message = "Email already registered" } });
        }

        // Resolve Basic role
        var basicRoleId = await _db.Roles.AsNoTracking()
            .Where(r => r.Name == "Basic")
            .Select(r => (Guid?)r.Id)
            .FirstOrDefaultAsync();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = _hasher.HashPassword(null!, request.Password),
            FullName = request.FullName,
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone,
            RoleId = basicRoleId,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        await _activity.LogAsync(user.Id, "Auth", user.Id, "UserCreated", "User signed up", TryCorrelationId());

        return Ok(new { data = new { id = user.Id, email = user.Email } });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> Refresh([FromBody] RefreshRequest request)
    {
        var hash = _refresh.Hash(request.RefreshToken);
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
        if (existing == null || existing.RevokedAt != null || existing.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            await _activity.LogAsync(null, "Auth", null, "RefreshFailed", "Invalid or expired refresh token", TryCorrelationId());
            return Unauthorized(new { error = new { code = "TOKEN_INVALID", message = "Refresh token invalid or expired" } });
        }

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == existing.UserId && u.IsActive);
        if (user == null)
        {
            await _activity.LogAsync(existing.UserId, "Auth", existing.UserId, "RefreshFailed", "User not active", TryCorrelationId());
            return Unauthorized(new { error = new { code = "TOKEN_INVALID", message = "User not active" } });
        }

        existing.RevokedAt = DateTimeOffset.UtcNow;

        var roleName2 = await _db.Roles.AsNoTracking()
            .Where(r => r.Id == user.RoleId)
            .Select(r => r.Name)
            .FirstOrDefaultAsync() ?? "Basic";
        var (accessToken, _) = _jwt.CreateAccessToken(user.Id, user.Email, user.RoleId, roleName2);
        var refreshTokenRaw = _refresh.GenerateToken();
        var refreshTokenHash = _refresh.Hash(refreshTokenRaw);
        var days = int.TryParse(_config["Jwt:RefreshDays"], out var d) ? d : 7;
        var newRt = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(days),
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.RefreshTokens.Add(newRt);
        await _db.SaveChangesAsync();
        await _activity.LogAsync(user.Id, "Auth", user.Id, "RefreshSucceeded", "Refresh token rotated", TryCorrelationId());

        return Ok(new { data = new { accessToken, refreshToken = refreshTokenRaw } });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var hash = _refresh.Hash(request.RefreshToken);
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash && r.UserId == userId);
        if (existing != null && existing.RevokedAt == null)
        {
            existing.RevokedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            await _activity.LogAsync(userId, "Auth", userId, "Logout", "User logged out", TryCorrelationId());
        }
        return NoContent();
    }

    private Guid? TryCorrelationId()
    {
        if (Request.Headers.TryGetValue("Correlation-Id", out var cid) && Guid.TryParse(cid, out var g))
            return g;
        return null;
    }
}
