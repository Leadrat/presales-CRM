using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Api.Models;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeController : ControllerBase
{
    private readonly AppDbContext _db;

    public MeController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<object>> GetMe()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(sub) || !Guid.TryParse(sub, out var userId))
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Invalid token" } });
        }

        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId && !u.IsDeleted && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Email,
                Role = _db.Roles.Where(r => r.Id == u.RoleId).Select(r => r.Name).FirstOrDefault() ?? "Basic"
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authorized" } });
        }

        return Ok(new { data = new { id = user.Id, email = user.Email, role = user.Role } });
    }
}
