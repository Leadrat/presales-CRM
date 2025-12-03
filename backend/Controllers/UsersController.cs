using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Models;
using Api.Services;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _current;

    public UsersController(AppDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public sealed record UserDetailDto(
        Guid Id,
        string Email,
        string? FullName,
        string? Phone,
        Guid? RoleId,
        string? RoleName,
        bool IsActive,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    public sealed record UserUpdateRequest(
        string? FullName,
        string? Email,
        string? Phone,
        Guid? RoleId,
        bool? IsActive
    );

    /// <summary>
    /// Return a lightweight list of active, non-deleted users for dropdowns.
    /// Shape is: { id, fullName, email }
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<object>> List()
    {
        var users = await _db.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                id = u.Id,
                fullName = u.FullName,
                email = u.Email
            })
            .ToListAsync();

        return Ok(new { data = users });
    }

    /// <summary>
    /// Return a paginated list of users for Team Management, with optional status and paging filters.
    /// This endpoint is used by the Team Management UI and should not affect the lightweight users lookup.
    /// </summary>
    [HttpGet("management")]
    public async Task<ActionResult<object>> GetManagementUsers(
        [FromQuery] string? status = "all",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var normalizedStatus = (status ?? "all").Trim().ToLowerInvariant();

        if (page <= 0)
        {
            page = 1;
        }

        if (pageSize <= 0)
        {
            pageSize = 20;
        }
        else if (pageSize > 100)
        {
            pageSize = 100;
        }

        var query = _db.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted);

        if (normalizedStatus == "active")
        {
            query = query.Where(u => u.IsActive);
        }
        else if (normalizedStatus == "inactive")
        {
            query = query.Where(u => !u.IsActive);
        }

        var totalCount = await query.LongCountAsync();

        var skip = (page - 1) * pageSize;
        if (skip < 0)
        {
            skip = 0;
        }

        List<object> items;
        try
        {
            items = await (from u in query
                           join r in _db.Roles.AsNoTracking() on u.RoleId equals r.Id into roleGroup
                           from r in roleGroup.DefaultIfEmpty()
                           orderby u.FullName ?? u.Email
                           select new
                           {
                               id = u.Id,
                               fullName = u.FullName,
                               email = u.Email,
                               phone = u.Phone,
                               isActive = u.IsActive,
                               roleName = r != null ? r.Name : null
                           })
                           .Skip(skip)
                           .Take(pageSize)
                           .ToListAsync<object>();
        }
        catch
        {
            // Fallback if Roles table is missing or migration not applied yet
            items = await query
                .OrderBy(u => u.FullName ?? u.Email)
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    isActive = u.IsActive,
                    roleName = (string?)null
                })
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync<object>();
        }

        var result = new
        {
            items,
            totalCount,
            page,
            pageSize
        };

        return Ok(new { data = result });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<object>> GetById(Guid id)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var dto = await (from u in _db.Users.AsNoTracking()
                         join r in _db.Roles.AsNoTracking() on u.RoleId equals r.Id into roleGroup
                         from r in roleGroup.DefaultIfEmpty()
                         where u.Id == id && !u.IsDeleted
                         select new UserDetailDto(
                             u.Id,
                             u.Email,
                             u.FullName,
                             u.Phone,
                             u.RoleId,
                             r != null ? r.Name : null,
                             u.IsActive,
                             u.CreatedAt,
                             u.UpdatedAt
                         ))
                         .FirstOrDefaultAsync();

        if (dto is null)
        {
            return NotFound(new { error = new { code = "USER_NOT_FOUND", message = "User not found" } });
        }

        return Ok(new { data = dto });
    }

    [HttpGet("roles")]
    public async Task<ActionResult<object>> GetRoles()
    {
        if (!_current.IsAuthenticated)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var roles = await _db.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new { id = r.Id, name = r.Name })
            .ToListAsync();

        return Ok(new { data = roles });
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] UserUpdateRequest request)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Only admins can modify users" } });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

        if (user == null)
        {
            return NotFound(new { error = new { code = "USER_NOT_FOUND", message = "User not found" } });
        }

        if (request.Email is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { error = new { code = "INVALID_EMAIL", message = "Email is required" } });
            }

            user.Email = request.Email.Trim();
        }

        if (request.FullName is not null)
        {
            var fullName = request.FullName.Trim();
            user.FullName = string.IsNullOrEmpty(fullName) ? null : fullName;
        }

        if (request.Phone is not null)
        {
            var phone = request.Phone.Trim();
            user.Phone = string.IsNullOrEmpty(phone) ? null : phone;
        }

        if (request.RoleId.HasValue)
        {
            var roleExists = await _db.Roles.AsNoTracking().AnyAsync(r => r.Id == request.RoleId.Value);
            if (!roleExists)
            {
                return BadRequest(new { error = new { code = "INVALID_ROLE", message = "Role not found" } });
            }

            user.RoleId = request.RoleId;
        }

        if (request.IsActive.HasValue)
        {
            user.IsActive = request.IsActive.Value;
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        var dto = await (from u in _db.Users.AsNoTracking()
                         join r in _db.Roles.AsNoTracking() on u.RoleId equals r.Id into roleGroup
                         from r in roleGroup.DefaultIfEmpty()
                         where u.Id == id && !u.IsDeleted
                         select new UserDetailDto(
                             u.Id,
                             u.Email,
                             u.FullName,
                             u.Phone,
                             u.RoleId,
                             r != null ? r.Name : null,
                             u.IsActive,
                             u.CreatedAt,
                             u.UpdatedAt
                         ))
                         .FirstAsync();

        return Ok(new { data = dto });
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Only admins can delete users" } });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user is null)
        {
            return NotFound(new { error = new { code = "USER_NOT_FOUND", message = "User not found" } });
        }

        user.IsDeleted = true;
        user.DeletedAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
