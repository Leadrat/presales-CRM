using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

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
}
