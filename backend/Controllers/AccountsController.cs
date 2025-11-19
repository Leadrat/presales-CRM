using System;
using System.Linq;
using System.Threading.Tasks;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Models;
using Api.Models.Interfaces;
using Api.Services;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _current;

    public AccountsController(AppDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public record AccountCreateRequest(
        string CompanyName,
        string? Website,
        Guid AccountTypeId,
        Guid AccountSizeId,
        Guid CurrentCrmId,
        int? NumberOfUsers,
        string CrmExpiry
    );

    // List accounts for current user (Admin: all; Basic: own only)
    [HttpGet]
    public async Task<ActionResult<object>> List()
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var role = _current.Role ?? "Basic";

        var query = _db.Accounts
            .AsNoTracking()
            .Include(a => a.AccountType)
            .Include(a => a.AccountSize)
            .Include(a => a.CurrentCrm)
            .Where(a => !a.IsDeleted);

        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.CreatedByUserId == _current.UserId);
        }

        var items = await query
            .OrderBy(a => a.CompanyName)
            .Select(a => new
            {
                id = a.Id,
                companyName = a.CompanyName,
                // Backend no longer stores Website / NumberOfUsers; return null for compatibility
                website = (string?)null,
                accountTypeId = a.AccountTypeId,
                accountSizeId = a.AccountSizeId,
                currentCrmId = a.CurrentCrmId,
                numberOfUsers = (int?)null,
                crmExpiry = a.CrmExpiry,
                createdByUserId = a.CreatedByUserId,
                createdAt = a.CreatedAt,
                updatedAt = a.UpdatedAt,
                isDeleted = a.IsDeleted,
                accountTypeName = a.AccountType != null ? a.AccountType.Name : string.Empty,
                accountSizeName = a.AccountSize != null ? a.AccountSize.Name : string.Empty,
                crmProviderName = a.CurrentCrm != null ? a.CurrentCrm.Name : string.Empty
            })
            .ToListAsync();

        return Ok(new { data = items });
    }

    // Create a new account
    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] AccountCreateRequest request)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        // Basic validation
        if (string.IsNullOrWhiteSpace(request.CompanyName))
        {
            return BadRequest(new { error = new { code = "INVALID_INPUT", message = "CompanyName is required" } });
        }

        // Parse CrmExpiry from MM/YY into a DateTimeOffset (assume end of month, UTC)
        if (!DateTime.TryParseExact(request.CrmExpiry, "MM/yy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var crmExpiryDate))
        {
            return BadRequest(new { error = new { code = "INVALID_CRM_EXPIRY", message = "CrmExpiry must be in MM/YY format" } });
        }

        var account = new Account
        {
            Id = Guid.NewGuid(),
            CompanyName = request.CompanyName,
            AccountTypeId = request.AccountTypeId,
            AccountSizeId = request.AccountSizeId,
            CurrentCrmId = request.CurrentCrmId,
            CrmExpiry = new DateTimeOffset(crmExpiryDate, TimeSpan.Zero),
            CreatedByUserId = _current.UserId.Value,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            IsDeleted = false
        };

        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            data = new
            {
                id = account.Id,
                companyName = account.CompanyName,
                website = (string?)null,
                accountTypeId = account.AccountTypeId,
                accountSizeId = account.AccountSizeId,
                currentCrmId = account.CurrentCrmId,
                numberOfUsers = (int?)null,
                crmExpiry = account.CrmExpiry,
                createdByUserId = account.CreatedByUserId,
                createdAt = account.CreatedAt,
                updatedAt = account.UpdatedAt,
                isDeleted = account.IsDeleted
            }
        });
    }

    // Lookup data for Accounts UI
    [HttpGet("lookups")]
    public async Task<ActionResult<object>> GetLookups()
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var accountTypes = await _db.AccountTypes
            .AsNoTracking()
            .OrderBy(t => t.DisplayOrder)
            .Select(t => new { id = t.Id, name = t.Name })
            .ToListAsync();

        var accountSizes = await _db.AccountSizes
            .AsNoTracking()
            .OrderBy(s => s.DisplayOrder)
            .Select(s => new
            {
                id = s.Id,
                name = s.Name,
                minUsers = (int?)null,
                maxUsers = (int?)null
            })
            .ToListAsync();

        var crmProviders = await _db.CrmProviders
            .AsNoTracking()
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                website = (string?)null
            })
            .ToListAsync();

        return Ok(new
        {
            data = new
            {
                accountTypes,
                accountSizes,
                crmProviders
            }
        });
    }

    [HttpGet("{id:guid}/detail")]
    public async Task<ActionResult<object>> GetDetail(Guid id)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .AsNoTracking()
            .Include(a => a.AccountType)
            .Include(a => a.AccountSize)
            .Include(a => a.CurrentCrm)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        // RBAC: Admin can see all; Basic only sees own accounts
        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.CreatedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to view this account" } });
        }

        // Data integrity checks for lookup entities
        if (account.AccountType == null || account.AccountSize == null || account.CurrentCrm == null)
        {
            return StatusCode(500, new { error = new { code = "ACCOUNT_DATA_INCONSISTENT", message = "Account lookup data is missing or inconsistent" } });
        }

        var contactCount = await _db.Contacts
            .AsNoTracking()
            .Where(c => c.AccountId == id && !c.IsDeleted)
            .CountAsync();

        var opportunityCount = await _db.Opportunities
            .AsNoTracking()
            .Where(o => o.AccountId == id && !o.IsDeleted)
            .CountAsync();

        var activityCount = await _db.Activities
            .AsNoTracking()
            .Where(a => a.AccountId == id && !a.IsDeleted)
            .CountAsync();

        var noteCount = await _db.Notes
            .AsNoTracking()
            .Where(n => n.AccountId == id && !n.IsDeleted)
            .CountAsync();

        var dto = new AccountDetailDto
        {
            Id = account.Id,
            CompanyName = account.CompanyName,
            AccountTypeId = account.AccountTypeId,
            AccountSizeId = account.AccountSizeId,
            CurrentCrmId = account.CurrentCrmId,
            Website = null,
            NumberOfUsers = null,
            AccountTypeName = account.AccountType.Name,
            AccountSizeName = account.AccountSize.Name,
            CrmProviderName = account.CurrentCrm.Name,
            CrmExpiry = account.CrmExpiry,
            CreatedAt = account.CreatedAt,
            ContactCount = contactCount,
            NoteCount = noteCount,
            // DemoCount will be populated once Demos are wired
            OpportunityCount = opportunityCount,
            ActivityCount = activityCount
        };

        return Ok(new { data = dto });
    }

    [HttpGet("{id:guid}/contacts")]
    public async Task<ActionResult<object>> GetContacts(Guid id)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.CreatedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to view this account" } });
        }

        var contacts = await _db.Contacts
            .AsNoTracking()
            .Where(c => c.AccountId == id && !c.IsDeleted)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                email = c.Email,
                phone = c.Phone,
                position = c.Position,
                createdAt = c.CreatedAt,
                updatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { data = contacts });
    }

    [HttpGet("{id:guid}/notes")]
    public async Task<ActionResult<object>> GetNotes(Guid id)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.CreatedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to view this account" } });
        }

        var notes = await _db.Notes
            .AsNoTracking()
            .Where(n => n.AccountId == id && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                id = n.Id,
                title = n.Title,
                // A simple snippet; can be refined when note body/content is introduced
                snippet = n.Title,
                createdAt = n.CreatedAt,
                updatedAt = n.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { data = notes });
    }

    [HttpGet("{id:guid}/activity-log")]
    public async Task<ActionResult<object>> GetActivityLog(Guid id)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.CreatedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to view this account" } });
        }

        var entries = await _db.ActivityLogs
            .AsNoTracking()
            .Where(l => l.EntityType == "Account" && l.EntityId == id)
            .Join(
                _db.ActivityTypes.AsNoTracking(),
                log => log.ActivityTypeId,
                type => type.Id,
                (log, type) => new
                {
                    id = log.Id,
                    timestamp = log.CreatedAt,
                    type = type.Name,
                    description = log.Message
                })
            .OrderByDescending(e => e.timestamp)
            .ToListAsync();

        return Ok(new { data = entries });
    }
}
