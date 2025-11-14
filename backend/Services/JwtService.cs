using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Api.Services;

public class JwtService
{
    private readonly IConfiguration _config;
    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public (string accessToken, DateTimeOffset expiresAt) CreateAccessToken(Guid userId, string email, Guid? roleId, string roleName)
    {
        var secret = _config["Jwt:Secret"] ?? string.Empty;
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];
        var accessMinutes = int.TryParse(_config["Jwt:AccessMinutes"], out var m) ? m : 15;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret.PadRight(32)));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var now = DateTimeOffset.UtcNow;
        var expires = now.AddMinutes(accessMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new("roleId", roleId?.ToString() ?? string.Empty),
            new(ClaimTypes.Role, roleName ?? string.Empty),
            new("role", roleName ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expires.UtcDateTime,
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return (tokenString, expires);
    }
}
