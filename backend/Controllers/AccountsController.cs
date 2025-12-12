using System;
using System.Collections.Generic;
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
    private readonly ActivityLogService _activity;

    private static readonly string[] AllowedLeadSources = new[]
    {
        "LINKEDIN", "INSTAGRAM", "WEBSITE", "COLD_CALL", "FACEBOOK", "GOOGLE_ADS", "REFERRAL"
    };

    private static readonly string[] AllowedDealStages = new[]
    {
        "NEW_LEAD", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"
    };

    public AccountsController(AppDbContext db, ICurrentUserService current, ActivityLogService activity)
    {
        _db = db;
        _current = current;
        _activity = activity;
    }

    /// <summary>
    /// Admin maintenance: Backfill ClosedDate for WON/LOST accounts that have null ClosedDate.
    /// Uses UpdatedAt as the fallback date; if null, uses UtcNow.
    /// </summary>
    [HttpPost("maintenance/backfill-closed-date")]
    public async Task<ActionResult<object>> BackfillClosedDate()
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Only admins can run maintenance" } });
        }

        var now = DateTimeOffset.UtcNow;
        var affected = await _db.Accounts
            .Where(a => !a.IsDeleted && (a.DealStage == "WON" || a.DealStage == "LOST") && a.ClosedDate == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.ClosedDate, a => a.UpdatedAt != default ? a.UpdatedAt : now)
                .SetProperty(a => a.UpdatedAt, _ => now));

        return Ok(new { data = new { updated = affected } });
    }

    public record AccountCreateRequest(
        string CompanyName,
        string? Website,
        Guid AccountTypeId,
        Guid AccountSizeId,
        Guid? CurrentCrmId,
        string? CurrentCrmName, // Text input for CRM name (legacy, use CrmTools instead)
        IReadOnlyList<string>? CrmTools, // Multi-select CRM tool names
        int? NumberOfUsers,
        string? CrmExpiry,
        string? LeadSource,
        string? DealStage,
        // New enriched profile fields (optional for backward compatibility)
        string? DecisionMakers,
        string? InstagramUrl,
        string? LinkedinUrl,
        string? Phone,
        string? Email,
        string? City,
        Guid? CreatedByUserId,
        Guid? AssignedToUserId,
        IReadOnlyList<ContactCreateRequest>? Contacts
    );

    public record AccountUpdateRequest(
        string CompanyName,
        string? Website,
        Guid AccountTypeId,
        Guid AccountSizeId,
        Guid? CurrentCrmId,
        string? CurrentCrmName, // Text input for CRM name (legacy, use CrmTools instead)
        IReadOnlyList<string>? CrmTools, // Multi-select CRM tool names
        int? NumberOfUsers,
        string? CrmExpiry,
        string? LeadSource,
        string? DealStage,
        string? ClosedDate,
        // New enriched profile fields (optional for backward compatibility)
        string? DecisionMakers,
        string? InstagramUrl,
        string? LinkedinUrl,
        string? Phone,
        string? Email,
        string? City,
        Guid? CreatedByUserId,
        Guid? AssignedToUserId
    );

    public record ContactCreateRequest(
        string Name,
        string? Email,
        string? PersonalPhone,
        string? WorkPhone,
        string? Designation,
        string? City,
        string? DateOfBirth,
        string? InstagramUrl,
        string? LinkedinUrl
    );

    public record ContactUpdateRequest(
        string? Name,
        string? Email,
        string? PersonalPhone,
        string? WorkPhone,
        string? Designation,
        string? City,
        string? DateOfBirth,
        string? InstagramUrl,
        string? LinkedinUrl
    );

    public record DemoCreateRequest(
        DateTimeOffset ScheduledAt,
        Guid DemoAlignedByUserId,
        string? Status,        // Optional, defaults to "Scheduled"
        DateTimeOffset? DoneAt,
        Guid? DemoDoneByUserId,
        string? Attendees,
        string? Notes
    );

    public record DemoUpdateRequest(
        DateTimeOffset? ScheduledAt,
        string? Status,        // Scheduled, Completed, Cancelled, NoShow
        DateTimeOffset? DoneAt,
        Guid? DemoDoneByUserId,
        string? Attendees,
        string? Notes,
        string? CompletionAttendees,
        string? CompletionNotes
    );

    // List accounts for current user
    [HttpGet]
    public async Task<ActionResult<object>> List()
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var query = _db.Accounts
            .AsNoTracking()
            .Include(a => a.AccountType)
            .Include(a => a.AccountSize)
            .Include(a => a.CurrentCrm)
            .Include(a => a.CreatedByUser)
            .Include(a => a.AssignedToUser)
            .Where(a => !a.IsDeleted);

        // Admins see all accounts; non-admins only see accounts they are assigned to
        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            var userId = _current.UserId.Value;
            query = query.Where(a => a.AssignedToUserId == userId);
        }

        var items = await query
            .OrderBy(a => a.CompanyName)
            .Select(a => new
            {
                id = a.Id,
                companyName = a.CompanyName,
                // Legacy fields kept for compatibility
                website = a.WebsiteUrl,
                accountTypeId = a.AccountTypeId,
                accountSizeId = a.AccountSizeId,
                currentCrmId = a.CurrentCrmId,
                numberOfUsers = (int?)a.NumberOfUsers,
                crmExpiry = a.CrmExpiry,
                createdByUserId = a.CreatedByUserId,
                createdAt = a.CreatedAt,
                updatedAt = a.UpdatedAt,
                isDeleted = a.IsDeleted,
                accountTypeName = a.AccountType != null ? a.AccountType.Name : string.Empty,
                accountSizeName = a.AccountSize != null ? a.AccountSize.Name : string.Empty,
                crmProviderName = a.CurrentCrm != null ? a.CurrentCrm.Name : string.Empty,
                // New enriched profile fields
                websiteUrl = a.WebsiteUrl,
                decisionMakers = a.DecisionMakers,
                instagramUrl = a.InstagramUrl,
                linkedinUrl = a.LinkedinUrl,
                phone = a.Phone,
                email = a.Email,
                city = a.City,
                leadSource = a.LeadSource,
                dealStage = a.DealStage,
                // Spec 17: Created By attribution - show creator's display name (FullName) or null if user is missing
                createdByUserDisplayName = a.CreatedByUser != null && !a.CreatedByUser.IsDeleted
                    ? a.CreatedByUser.FullName
                    : null,
                assignedToUserId = a.AssignedToUserId,
                assignedToUserDisplayName = a.AssignedToUser != null && !a.AssignedToUser.IsDeleted
                    ? a.AssignedToUser.FullName
                    : null,
                // Computed account size label from NumberOfUsers
                accountSize = a.NumberOfUsers <= 0
                    ? null
                    : a.NumberOfUsers >= 1 && a.NumberOfUsers <= 4 ? "Micro"
                    : a.NumberOfUsers <= 9 ? "Little"
                    : a.NumberOfUsers <= 24 ? "Small"
                    : a.NumberOfUsers <= 49 ? "Medium"
                    : "Enterprise"
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

        // Parse CrmExpiry from MM/YY into a DateTimeOffset (assume end of month, UTC) - optional
        DateTimeOffset? crmExpiryDate = null;
        if (!string.IsNullOrWhiteSpace(request.CrmExpiry))
        {
            if (!DateTime.TryParseExact(request.CrmExpiry, "MM/yy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
            {
                return BadRequest(new { error = new { code = "INVALID_CRM_EXPIRY", message = "CrmExpiry must be in MM/YY format" } });
            }
            crmExpiryDate = new DateTimeOffset(parsedDate, TimeSpan.Zero);
        }

        var leadSource = string.IsNullOrWhiteSpace(request.LeadSource) ? null : request.LeadSource.Trim().ToUpperInvariant();
        if (!AllowedLeadSources.Contains(leadSource))
        {
            return BadRequest(new { error = new { code = "INVALID_LEAD_SOURCE", message = "LeadSource is not valid." } });
        }

        var dealStage = string.IsNullOrWhiteSpace(request.DealStage) ? "NEW_LEAD" : request.DealStage.Trim().ToUpperInvariant();
        if (!AllowedDealStages.Contains(dealStage))
        {
            return BadRequest(new { error = new { code = "INVALID_DEAL_STAGE", message = "DealStage is not valid." } });
        }

        var now = DateTimeOffset.UtcNow;

        var crmProviderId = await ResolveCrmProviderAsync(request.CurrentCrmId, request.CurrentCrmName);

        // Use default expiry (1 year from now) if not provided

        // Process CrmTools: auto-create new CRM providers if needed
        var crmTools = new List<string>();
        if (request.CrmTools != null && request.CrmTools.Count > 0)
        {
            foreach (var toolName in request.CrmTools.Where(t => !string.IsNullOrWhiteSpace(t)).Distinct())
            {
                var trimmedName = toolName.Trim();
                crmTools.Add(trimmedName);
                
                // Auto-create CRM provider if it doesn't exist (for dropdown suggestions)
                var existingProvider = await _db.CrmProviders
                    .FirstOrDefaultAsync(p => p.Name.ToLower() == trimmedName.ToLower());
                if (existingProvider == null)
                {
                    var maxOrder = await _db.CrmProviders.MaxAsync(p => (int?)p.DisplayOrder) ?? 0;
                    _db.CrmProviders.Add(new CrmProvider
                    {
                        Id = Guid.NewGuid(),
                        Name = trimmedName,
                        DisplayOrder = maxOrder + 1
                    });
                }
            }
        }

        // Determine CreatedByUserId and AssignedToUserId
        var createdByUserId = request.CreatedByUserId ?? _current.UserId.Value;
        var assignedToUserId = request.AssignedToUserId ?? _current.UserId.Value;

        var account = new Account
        {
            Id = Guid.NewGuid(),
            CompanyName = request.CompanyName,
            AccountTypeId = request.AccountTypeId,
            AccountSizeId = request.AccountSizeId,
            CurrentCrmId = crmProviderId,
            CrmTools = crmTools,
            CrmExpiry = crmExpiryDate,
            LeadSource = leadSource,
            DealStage = dealStage,
            CreatedByUserId = createdByUserId,
            AssignedToUserId = assignedToUserId,
            CreatedAt = now,
            UpdatedAt = now,
            IsDeleted = false,
            // Map enriched profile fields (with safe fallbacks for now)
            WebsiteUrl = request.Website ?? string.Empty,
            DecisionMakers = request.DecisionMakers ?? string.Empty,
            NumberOfUsers = request.NumberOfUsers ?? 0,
            InstagramUrl = request.InstagramUrl ?? string.Empty,
            LinkedinUrl = request.LinkedinUrl ?? string.Empty,
            Phone = request.Phone ?? string.Empty,
            Email = request.Email ?? string.Empty,
            City = request.City ?? string.Empty
        };

        _db.Accounts.Add(account);

        // Optionally create nested contacts as part of the same transaction
        var nestedContacts = request.Contacts ?? Array.Empty<ContactCreateRequest>();

        foreach (var c in nestedContacts)
        {
            if (c is null)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(c.Name))
            {
                return BadRequest(new { error = new { code = "INVALID_INPUT", message = "Contact Name is required" } });
            }

            DateTimeOffset? dateOfBirth = null;
            if (!string.IsNullOrWhiteSpace(c.DateOfBirth))
            {
                if (!DateTimeOffset.TryParse(c.DateOfBirth, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dob))
                {
                    return BadRequest(new { error = new { code = "INVALID_DATE_OF_BIRTH", message = "Contact DateOfBirth is not in a valid format" } });
                }

                dateOfBirth = dob.ToUniversalTime();
            }

            var contact = new Contact
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                CreatedByUserId = _current.UserId.Value,
                Name = c.Name.Trim(),
                Email = string.IsNullOrWhiteSpace(c.Email) ? null : c.Email.Trim(),
                // Keep legacy Phone/Position populated for compatibility
                Phone = !string.IsNullOrWhiteSpace(c.WorkPhone)
                    ? c.WorkPhone.Trim()
                    : string.IsNullOrWhiteSpace(c.PersonalPhone) ? null : c.PersonalPhone.Trim(),
                Position = string.IsNullOrWhiteSpace(c.Designation) ? null : c.Designation.Trim(),
                PersonalPhone = string.IsNullOrWhiteSpace(c.PersonalPhone) ? null : c.PersonalPhone.Trim(),
                WorkPhone = string.IsNullOrWhiteSpace(c.WorkPhone) ? null : c.WorkPhone.Trim(),
                Designation = string.IsNullOrWhiteSpace(c.Designation) ? null : c.Designation.Trim(),
                City = string.IsNullOrWhiteSpace(c.City) ? null : c.City.Trim(),
                DateOfBirth = dateOfBirth,
                InstagramUrl = string.IsNullOrWhiteSpace(c.InstagramUrl) ? null : c.InstagramUrl.Trim(),
                LinkedinUrl = string.IsNullOrWhiteSpace(c.LinkedinUrl) ? null : c.LinkedinUrl.Trim(),
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };

            _db.Contacts.Add(contact);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            data = new
            {
                id = account.Id,
                companyName = account.CompanyName,
                website = account.WebsiteUrl,
                accountTypeId = account.AccountTypeId,
                accountSizeId = account.AccountSizeId,
                currentCrmId = account.CurrentCrmId,
                crmTools = account.CrmTools,
                numberOfUsers = (int?)account.NumberOfUsers,
                crmExpiry = account.CrmExpiry,
                createdByUserId = account.CreatedByUserId,
                assignedToUserId = account.AssignedToUserId,
                createdAt = account.CreatedAt,
                updatedAt = account.UpdatedAt,
                isDeleted = account.IsDeleted,
                // Enriched profile fields (duplicated for detail parity)
                websiteUrl = account.WebsiteUrl,
                decisionMakers = account.DecisionMakers,
                instagramUrl = account.InstagramUrl,
                linkedinUrl = account.LinkedinUrl,
                phone = account.Phone,
                email = account.Email,
                leadSource = account.LeadSource,
                dealStage = account.DealStage,
                accountSize = account.NumberOfUsers <= 0
                    ? null
                    : account.NumberOfUsers >= 1 && account.NumberOfUsers <= 4 ? "Micro"
                    : account.NumberOfUsers <= 9 ? "Little"
                    : account.NumberOfUsers <= 24 ? "Small"
                    : account.NumberOfUsers <= 49 ? "Medium"
                    : "Enterprise"
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
            .Where(t => t.Name != "Unassigned")
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

    /// <summary>
    /// Maintenance: Hard delete sample/demo accounts like "Alice Example", "Bob Example", and "Basic Account".
    /// Admin only. Irreversible.
    /// </summary>
    [HttpPost("cleanup-samples")]
    public async Task<ActionResult<object>> HardDeleteSampleAccounts()
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Only admins can perform maintenance deletes" } });
        }

        // Match company names that contain these token pairs (case-insensitive)
        string[] tokenA1 = new[] { "alice", "example" };
        string[] tokenA2 = new[] { "bob", "example" };
        string[] tokenA3 = new[] { "basic", "account" };

        var candidates = await _db.Accounts
            .Where(a => !a.IsDeleted)
            .Select(a => new { a.Id, a.CompanyName })
            .ToListAsync();

        bool ContainsAllTokens(string name, string[] tokens)
        {
            var lower = (name ?? string.Empty).ToLowerInvariant();
            foreach (var t in tokens)
            {
                if (!lower.Contains(t)) return false;
            }
            return true;
        }

        var targetIds = candidates
            .Where(a => ContainsAllTokens(a.CompanyName, tokenA1)
                        || ContainsAllTokens(a.CompanyName, tokenA2)
                        || ContainsAllTokens(a.CompanyName, tokenA3))
            .Select(a => a.Id)
            .ToList();

        if (targetIds.Count == 0)
        {
            return Ok(new { data = new { accountsDeleted = 0, contactsDeleted = 0, demosDeleted = 0, notesDeleted = 0, activitiesDeleted = 0, opportunitiesDeleted = 0 } });
        }

        // Delete children first to satisfy FK constraints
        var contacts = await _db.Contacts.Where(c => targetIds.Contains(c.AccountId)).ToListAsync();
        var demos = await _db.Demos.Where(d => targetIds.Contains(d.AccountId)).ToListAsync();
        var notes = await _db.Notes.Where(n => targetIds.Contains(n.AccountId)).ToListAsync();
        var activities = await _db.Activities.Where(ac => targetIds.Contains(ac.AccountId)).ToListAsync();
        var opportunities = await _db.Opportunities.Where(o => targetIds.Contains(o.AccountId)).ToListAsync();

        int contactsDeleted = contacts.Count;
        int demosDeleted = demos.Count;
        int notesDeleted = notes.Count;
        int activitiesDeleted = activities.Count;
        int opportunitiesDeleted = opportunities.Count;

        _db.Contacts.RemoveRange(contacts);
        _db.Demos.RemoveRange(demos);
        _db.Notes.RemoveRange(notes);
        _db.Activities.RemoveRange(activities);
        _db.Opportunities.RemoveRange(opportunities);

        var accounts = await _db.Accounts.Where(a => targetIds.Contains(a.Id)).ToListAsync();
        int accountsDeleted = accounts.Count;
        _db.Accounts.RemoveRange(accounts);

        await _db.SaveChangesAsync();

        return Ok(new
        {
            data = new
            {
                accountsDeleted,
                contactsDeleted,
                demosDeleted,
                notesDeleted,
                activitiesDeleted,
                opportunitiesDeleted
            }
        });
    }

    [HttpPost("{id:guid}/demos")]
    public async Task<ActionResult<object>> CreateDemo(Guid id, [FromBody] DemoCreateRequest request)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.AssignedToUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to modify this account" } });
        }

        // Validate status if provided
        var status = string.IsNullOrWhiteSpace(request.Status) ? DemoStatus.Scheduled : request.Status.Trim();
        if (!DemoStatus.IsValid(status))
        {
            return BadRequest(new { error = new { code = "INVALID_STATUS", message = "Status must be one of: Scheduled, Completed, Cancelled, NoShow" } });
        }

        var now = DateTimeOffset.UtcNow;

        var demo = new Demo
        {
            Id = Guid.NewGuid(),
            AccountId = id,
            DemoAlignedByUserId = request.DemoAlignedByUserId,
            DemoDoneByUserId = request.DemoDoneByUserId,
            ScheduledAt = request.ScheduledAt,
            DoneAt = request.DoneAt,
            Status = status,
            Attendees = string.IsNullOrWhiteSpace(request.Attendees) ? null : request.Attendees.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
            IsDeleted = false
        };

        _db.Demos.Add(demo);
        await _db.SaveChangesAsync();

        // Log demo scheduled activity (User Story 3)
        if (_current.UserId is Guid actorUserId)
        {
            await _activity.LogDemoScheduledAsync(actorUserId, id, demo.Id, demo.ScheduledAt);
        }

        // Reload as DemoDto with user names populated
        var dto = await _db.Demos
            .AsNoTracking()
            .Where(d => d.Id == demo.Id)
            .Select(d => new DemoDto
            {
                Id = d.Id,
                AccountId = d.AccountId,
                ScheduledAt = d.ScheduledAt,
                DoneAt = d.DoneAt,
                Status = d.Status,
                DemoAlignedByUserId = d.DemoAlignedByUserId,
                DemoAlignedByName = d.DemoAlignedByUser != null ? d.DemoAlignedByUser.FullName : null,
                DemoDoneByUserId = d.DemoDoneByUserId,
                DemoDoneByName = d.DemoDoneByUser != null ? d.DemoDoneByUser.FullName : null,
                Attendees = d.Attendees,
                Notes = d.Notes,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt
            })
            .FirstAsync();

        return Ok(new { data = dto });
    }

    [HttpGet("{id:guid}/demos")]
    public async Task<ActionResult<object>> GetDemos(Guid id)
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

        // Spec 17: All users (Basic and Admin) can view all accounts
        var demos = await _db.Demos
            .AsNoTracking()
            .Where(d => d.AccountId == id && !d.IsDeleted)
            .OrderByDescending(d => d.ScheduledAt)
            .Select(d => new DemoDto
            {
                Id = d.Id,
                AccountId = d.AccountId,
                ScheduledAt = d.ScheduledAt,
                DoneAt = d.DoneAt,
                Status = d.Status,
                DemoAlignedByUserId = d.DemoAlignedByUserId,
                DemoAlignedByName = d.DemoAlignedByUser != null ? d.DemoAlignedByUser.FullName : null,
                DemoDoneByUserId = d.DemoDoneByUserId,
                DemoDoneByName = d.DemoDoneByUser != null ? d.DemoDoneByUser.FullName : null,
                Attendees = d.Attendees,
                Notes = d.Notes,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { data = demos });
    }

    [HttpPut("{accountId:guid}/demos/{demoId:guid}")]
    public async Task<ActionResult<object>> UpdateDemo(Guid accountId, Guid demoId, [FromBody] DemoUpdateRequest request)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.AssignedToUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to modify this account" } });
        }

        var demo = await _db.Demos.FirstOrDefaultAsync(d => d.Id == demoId && d.AccountId == accountId && !d.IsDeleted);

        if (demo == null)
        {
            return NotFound(new { error = new { code = "DEMO_NOT_FOUND", message = "Demo not found" } });
        }

        var originalStatus = demo.Status;
        string? requestedStatus = null;
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!DemoStatus.IsValid(request.Status))
            {
                return BadRequest(new { error = new { code = "INVALID_STATUS", message = "Status must be one of: Scheduled, Completed, Cancelled, NoShow" } });
            }

            requestedStatus = request.Status.Trim();
        }

        var now = DateTimeOffset.UtcNow;

        if (requestedStatus == DemoStatus.Completed && originalStatus == DemoStatus.Scheduled)
        {
            var completedDemo = new Demo
            {
                Id = Guid.NewGuid(),
                AccountId = demo.AccountId,
                DemoAlignedByUserId = demo.DemoAlignedByUserId,
                DemoDoneByUserId = request.DemoDoneByUserId ?? _current.UserId ?? demo.DemoAlignedByUserId,
                ScheduledAt = demo.ScheduledAt,
                DoneAt = request.DoneAt ?? now,
                Status = DemoStatus.Completed,
                Attendees = string.IsNullOrWhiteSpace(request.CompletionAttendees) ? null : request.CompletionAttendees.Trim(),
                Notes = string.IsNullOrWhiteSpace(request.CompletionNotes) ? null : request.CompletionNotes.Trim(),
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };

            _db.Demos.Add(completedDemo);
            await _db.SaveChangesAsync();

            if (_current.UserId is Guid actorUserId)
            {
                await _activity.LogDemoCompletedAsync(actorUserId, account.Id, completedDemo.Id, completedDemo.DoneAt, demo.ScheduledAt);
            }

            var dto = await _db.Demos
                .AsNoTracking()
                .Where(d => d.Id == completedDemo.Id)
                .Select(d => new DemoDto
                {
                    Id = d.Id,
                    AccountId = d.AccountId,
                    ScheduledAt = d.ScheduledAt,
                    DoneAt = d.DoneAt,
                    Status = d.Status,
                    DemoAlignedByUserId = d.DemoAlignedByUserId,
                    DemoAlignedByName = d.DemoAlignedByUser != null ? d.DemoAlignedByUser.FullName : null,
                    DemoDoneByUserId = d.DemoDoneByUserId,
                    DemoDoneByName = d.DemoDoneByUser != null ? d.DemoDoneByUser.FullName : null,
                    Attendees = d.Attendees,
                    Notes = d.Notes,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .FirstAsync();

            return Ok(new { data = dto });
        }

        if (request.ScheduledAt.HasValue)
        {
            demo.ScheduledAt = request.ScheduledAt.Value;
        }

        if (requestedStatus is not null)
        {
            demo.Status = requestedStatus;
        }

        if (request.DoneAt.HasValue)
        {
            demo.DoneAt = request.DoneAt;
        }
        else if (requestedStatus == DemoStatus.Completed && demo.DoneAt is null)
        {
            demo.DoneAt = now;
        }

        if (request.DemoDoneByUserId.HasValue)
        {
            demo.DemoDoneByUserId = request.DemoDoneByUserId;
        }
        else if (demo.Status == DemoStatus.Completed && demo.DemoDoneByUserId is null)
        {
            demo.DemoDoneByUserId = _current.UserId ?? demo.DemoAlignedByUserId;
        }

        if (request.Attendees is not null)
        {
            demo.Attendees = string.IsNullOrWhiteSpace(request.Attendees) ? null : request.Attendees.Trim();
        }

        if (request.Notes is not null)
        {
            demo.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        }

        demo.UpdatedAt = now;

        await _db.SaveChangesAsync();

        if (_current.UserId is Guid actorUserId2)
        {
            if (requestedStatus == DemoStatus.Completed && originalStatus != DemoStatus.Completed)
            {
                await _activity.LogDemoCompletedAsync(actorUserId2, account.Id, demo.Id, demo.DoneAt, demo.ScheduledAt);
            }
            else if (requestedStatus == DemoStatus.Cancelled && originalStatus != DemoStatus.Cancelled)
            {
                await _activity.LogDemoCancelledAsync(actorUserId2, account.Id, demo.Id);
            }
            else
            {
                await _activity.LogDemoUpdatedAsync(actorUserId2, account.Id, demo.Id);
            }
        }

        var response = new DemoDto
        {
            Id = demo.Id,
            AccountId = demo.AccountId,
            ScheduledAt = demo.ScheduledAt,
            DoneAt = demo.DoneAt,
            Status = demo.Status,
            DemoAlignedByUserId = demo.DemoAlignedByUserId,
            DemoAlignedByName = demo.DemoAlignedByUser?.FullName,
            DemoDoneByUserId = demo.DemoDoneByUserId,
            DemoDoneByName = demo.DemoDoneByUser?.FullName,
            Attendees = demo.Attendees,
            Notes = demo.Notes,
            CreatedAt = demo.CreatedAt,
            UpdatedAt = demo.UpdatedAt
        };

        return Ok(new { data = response });
    }

    [HttpDelete("{accountId:guid}/demos/{demoId:guid}")]
    public async Task<ActionResult> DeleteDemo(Guid accountId, Guid demoId)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var demo = await _db.Demos.FirstOrDefaultAsync(d => d.Id == demoId && d.AccountId == accountId && !d.IsDeleted);

        if (demo == null)
        {
            return NotFound(new { error = new { code = "DEMO_NOT_FOUND", message = "Demo not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) && demo.DemoAlignedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to delete this demo" } });
        }

        demo.IsDeleted = true;
        demo.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        if (_current.UserId is Guid actorUserId)
        {
            await _activity.LogDemoDeletedAsync(actorUserId, account.Id, demo.Id);
        }

        return NoContent();
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
            .Include(a => a.CreatedByUser)
            .Include(a => a.AssignedToUser)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        // Spec 17: All users (Basic and Admin) can view all accounts
        // Edit/delete permissions remain role-based and are checked in Update/Delete methods

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

        var demoCount = await _db.Demos
            .AsNoTracking()
            .Where(d => d.AccountId == id && !d.IsDeleted)
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
            Website = account.WebsiteUrl,
            NumberOfUsers = account.NumberOfUsers,
            WebsiteUrl = account.WebsiteUrl,
            DecisionMakers = account.DecisionMakers,
            InstagramUrl = account.InstagramUrl,
            LinkedinUrl = account.LinkedinUrl,
            Phone = account.Phone,
            Email = account.Email,
            City = account.City,
            AccountTypeName = account.AccountType.Name,
            AccountSizeName = account.AccountSize.Name,
            CrmProviderName = account.CurrentCrm.Name,
            CrmTools = account.CrmTools ?? new List<string>(),
            CrmExpiry = account.CrmExpiry,
            LeadSource = account.LeadSource,
            DealStage = account.DealStage,
            ClosedDate = account.ClosedDate,
            CreatedAt = account.CreatedAt,
            ContactCount = contactCount,
            DemoCount = demoCount,
            NoteCount = noteCount,
            OpportunityCount = opportunityCount,
            ActivityCount = activityCount,
            CreatedByUserId = account.CreatedByUserId,
            CreatedByUserDisplayName = account.CreatedByUser != null && !account.CreatedByUser.IsDeleted
                ? account.CreatedByUser.FullName
                : null,
            AssignedToUserId = account.AssignedToUserId,
            AssignedToUserDisplayName = account.AssignedToUser != null && !account.AssignedToUser.IsDeleted
                ? account.AssignedToUser.FullName
                : null
        };

        return Ok(new { data = dto });
    }

    // Update an existing account (Admin: all; Basic: own only)
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<object>> Update(Guid id, [FromBody] AccountUpdateRequest request)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        if (string.IsNullOrWhiteSpace(request.CompanyName))
        {
            return BadRequest(new { error = new { code = "INVALID_INPUT", message = "CompanyName is required" } });
        }

        // Parse CrmExpiry from MM/YY into a DateTimeOffset (assume end of month, UTC) - optional
        bool clearCrmExpiry = false;
        DateTimeOffset? crmExpiryDate = null;
        if (request.CrmExpiry != null)
        {
            if (string.IsNullOrWhiteSpace(request.CrmExpiry))
            {
                clearCrmExpiry = true;
            }
            else
            {
                if (!DateTime.TryParseExact(request.CrmExpiry, "MM/yy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    return BadRequest(new { error = new { code = "INVALID_CRM_EXPIRY", message = "CrmExpiry must be in MM/YY format" } });
                }
                crmExpiryDate = new DateTimeOffset(parsedDate, TimeSpan.Zero);
            }
        }

        var leadSource = request.LeadSource is null
            ? null
            : request.LeadSource.Trim().ToUpperInvariant();
        if (leadSource is not null && !AllowedLeadSources.Contains(leadSource))
        {
            return BadRequest(new { error = new { code = "INVALID_LEAD_SOURCE", message = "LeadSource is not valid." } });
        }

        var dealStage = request.DealStage is null
            ? null
            : request.DealStage.Trim().ToUpperInvariant();
        if (dealStage is not null && !AllowedDealStages.Contains(dealStage))
        {
            return BadRequest(new { error = new { code = "INVALID_DEAL_STAGE", message = "DealStage is not valid." } });
        }

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.AssignedToUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to update this account" } });
        }

        // Capture original values for key fields to support Activity Log field-change entries
        var originalLeadSource = account.LeadSource;
        var originalDealStage = account.DealStage;
        var originalDecisionMakers = account.DecisionMakers;

        account.CompanyName = request.CompanyName;
        account.AccountTypeId = request.AccountTypeId;
        account.AccountSizeId = request.AccountSizeId;
        
        // Update CRM fields only if provided, otherwise keep existing values
        if (request.CurrentCrmId.HasValue)
        {
            account.CurrentCrmId = request.CurrentCrmId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(request.CurrentCrmName))
        {
            account.CurrentCrmId = await ResolveCrmProviderAsync(null, request.CurrentCrmName);
        }
        
        // Update CrmTools if provided
        if (request.CrmTools != null)
        {
            var crmTools = new List<string>();
            foreach (var toolName in request.CrmTools.Where(t => !string.IsNullOrWhiteSpace(t)).Distinct())
            {
                var trimmedName = toolName.Trim();
                crmTools.Add(trimmedName);
                
                // Auto-create CRM provider if it doesn't exist (for dropdown suggestions)
                var existingProvider = await _db.CrmProviders
                    .FirstOrDefaultAsync(p => p.Name.ToLower() == trimmedName.ToLower());
                if (existingProvider == null)
                {
                    var maxOrder = await _db.CrmProviders.MaxAsync(p => (int?)p.DisplayOrder) ?? 0;
                    _db.CrmProviders.Add(new CrmProvider
                    {
                        Id = Guid.NewGuid(),
                        Name = trimmedName,
                        DisplayOrder = maxOrder + 1
                    });
                }
            }
            account.CrmTools = crmTools;
        }
        
        if (clearCrmExpiry)
        {
            account.CrmExpiry = null;
        }
        else if (crmExpiryDate.HasValue)
        {
            account.CrmExpiry = crmExpiryDate.Value;
        }
        if (leadSource is not null)
        {
            account.LeadSource = leadSource;
        }
        if (dealStage is not null)
        {
            account.DealStage = dealStage;
        }

        if (!string.IsNullOrWhiteSpace(request.ClosedDate))
        {
            if (DateTimeOffset.TryParse(request.ClosedDate, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var closed))
            {
                account.ClosedDate = closed.ToUniversalTime();
            }
            else
            {
                return BadRequest(new { error = new { code = "INVALID_CLOSED_DATE", message = "ClosedDate must be a valid date value" } });
            }
        }
        else if (request.ClosedDate == string.Empty)
        {
            account.ClosedDate = null;
        }

        // Auto-manage ClosedDate if DealStage changed and ClosedDate was not explicitly provided
        if (dealStage is not null && !string.Equals(originalDealStage, account.DealStage, StringComparison.OrdinalIgnoreCase)
            && request.ClosedDate is null)
        {
            var now = DateTimeOffset.UtcNow;
            var stage = account.DealStage?.Trim().ToUpperInvariant();
            if (stage == "WON" || stage == "LOST")
            {
                if (account.ClosedDate is null)
                {
                    account.ClosedDate = now;
                }
            }
            else
            {
                // If moving away from a closed stage, clear ClosedDate unless caller explicitly set it
                if (account.ClosedDate is not null)
                {
                    account.ClosedDate = null;
                }
            }
        }

        // Allow both Admin and Basic users (if they can edit the account at all) to change CreatedBy and AssignedTo
        if (request.CreatedByUserId.HasValue)
        {
            account.CreatedByUserId = request.CreatedByUserId.Value;
        }

        if (request.AssignedToUserId.HasValue)
        {
            account.AssignedToUserId = request.AssignedToUserId.Value;
        }
        // Update enriched profile fields if provided (keep existing if null)
        if (request.Website is not null)
        {
            account.WebsiteUrl = request.Website;
        }
        if (request.DecisionMakers is not null)
        {
            account.DecisionMakers = request.DecisionMakers;
        }
        if (request.InstagramUrl is not null)
        {
            account.InstagramUrl = request.InstagramUrl;
        }
        if (request.LinkedinUrl is not null)
        {
            account.LinkedinUrl = request.LinkedinUrl;
        }
        if (request.Phone is not null)
        {
            account.Phone = request.Phone;
        }
        if (request.Email is not null)
        {
            account.Email = request.Email;
        }
        if (request.City is not null)
        {
            account.City = request.City;
        }
        // For now, only update NumberOfUsers when explicitly present
        if (int.TryParse(request.NumberOfUsers?.ToString(), out var numUsers))
        {
            account.NumberOfUsers = numUsers;
        }
        account.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        // Log key field changes to Activity Log (User Story 2)
        if (_current.UserId is Guid actorUserId)
        {
            await _activity.LogLeadSourceChangedAsync(actorUserId, account.Id, originalLeadSource, account.LeadSource);
            await _activity.LogDealStageChangedAsync(actorUserId, account.Id, originalDealStage, account.DealStage);
            await _activity.LogDecisionMakersChangedAsync(actorUserId, account.Id, originalDecisionMakers, account.DecisionMakers);
        }

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

    // Soft delete an account (Admin: all; Basic: own only)
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> SoftDelete(Guid id)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.CreatedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to delete this account" } });
        }

        account.IsDeleted = true;
        account.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
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

        // Spec 17: All users (Basic and Admin) can view all accounts
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
                personalPhone = c.PersonalPhone,
                workPhone = c.WorkPhone,
                designation = c.Designation,
                city = c.City,
                dateOfBirth = c.DateOfBirth,
                instagramUrl = c.InstagramUrl,
                linkedinUrl = c.LinkedinUrl,
                createdAt = c.CreatedAt,
                updatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { data = contacts });
    }

    [HttpPost("{id:guid}/contacts")]
    public async Task<ActionResult<object>> CreateContact(Guid id, [FromBody] ContactCreateRequest request)
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
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to modify this account" } });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { error = new { code = "INVALID_INPUT", message = "Name is required" } });
        }

        DateTimeOffset? dateOfBirth = null;
        if (!string.IsNullOrWhiteSpace(request.DateOfBirth))
        {
            if (!DateTimeOffset.TryParse(request.DateOfBirth, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dob))
            {
                return BadRequest(new { error = new { code = "INVALID_DATE_OF_BIRTH", message = "DateOfBirth is not in a valid format" } });
            }

            dateOfBirth = dob.ToUniversalTime();
        }

        var now = DateTimeOffset.UtcNow;

        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            AccountId = id,
            CreatedByUserId = _current.UserId.Value,
            Name = request.Name.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            // Keep legacy Phone/Position populated for compatibility
            Phone = !string.IsNullOrWhiteSpace(request.WorkPhone)
                ? request.WorkPhone.Trim()
                : string.IsNullOrWhiteSpace(request.PersonalPhone) ? null : request.PersonalPhone.Trim(),
            Position = string.IsNullOrWhiteSpace(request.Designation) ? null : request.Designation.Trim(),
            PersonalPhone = string.IsNullOrWhiteSpace(request.PersonalPhone) ? null : request.PersonalPhone.Trim(),
            WorkPhone = string.IsNullOrWhiteSpace(request.WorkPhone) ? null : request.WorkPhone.Trim(),
            Designation = string.IsNullOrWhiteSpace(request.Designation) ? null : request.Designation.Trim(),
            City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim(),
            DateOfBirth = dateOfBirth,
            InstagramUrl = string.IsNullOrWhiteSpace(request.InstagramUrl) ? null : request.InstagramUrl.Trim(),
            LinkedinUrl = string.IsNullOrWhiteSpace(request.LinkedinUrl) ? null : request.LinkedinUrl.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
            IsDeleted = false
        };

        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync();

        // Log contact added activity (User Story 3)
        if (_current.UserId is Guid actorUserId)
        {
            await _activity.LogContactAddedAsync(actorUserId, id, contact.Id, contact.Name);
        }

        return Ok(new
        {
            data = new
            {
                id = contact.Id,
                name = contact.Name,
                email = contact.Email,
                phone = contact.Phone,
                position = contact.Position,
                personalPhone = contact.PersonalPhone,
                workPhone = contact.WorkPhone,
                designation = contact.Designation,
                city = contact.City,
                dateOfBirth = contact.DateOfBirth,
                instagramUrl = contact.InstagramUrl,
                linkedinUrl = contact.LinkedinUrl,
                createdAt = contact.CreatedAt,
                updatedAt = contact.UpdatedAt
            }
        });
    }

    [HttpPut("{accountId:guid}/contacts/{contactId:guid}")]
    public async Task<ActionResult<object>> UpdateContact(Guid accountId, Guid contactId, [FromBody] ContactUpdateRequest request)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.CreatedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to modify this account" } });
        }

        var contact = await _db.Contacts.FirstOrDefaultAsync(c => c.Id == contactId && c.AccountId == accountId && !c.IsDeleted);

        if (contact == null)
        {
            return NotFound(new { error = new { code = "CONTACT_NOT_FOUND", message = "Contact not found" } });
        }

        if (request.Name is not null && string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { error = new { code = "INVALID_INPUT", message = "Name cannot be empty" } });
        }

        DateTimeOffset? dateOfBirth = null;
        var hasDateOfBirthUpdate = request.DateOfBirth is not null;
        if (hasDateOfBirthUpdate && !string.IsNullOrWhiteSpace(request.DateOfBirth))
        {
            if (!DateTimeOffset.TryParse(request.DateOfBirth, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dob))
            {
                return BadRequest(new { error = new { code = "INVALID_DATE_OF_BIRTH", message = "DateOfBirth is not in a valid format" } });
            }

            dateOfBirth = dob.ToUniversalTime();
        }

        var originalName = contact.Name;

        if (request.Name is not null)
        {
            contact.Name = request.Name.Trim();
        }
        if (request.Email is not null)
        {
            contact.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        }
        if (request.PersonalPhone is not null)
        {
            contact.PersonalPhone = string.IsNullOrWhiteSpace(request.PersonalPhone) ? null : request.PersonalPhone.Trim();
        }
        if (request.WorkPhone is not null)
        {
            contact.WorkPhone = string.IsNullOrWhiteSpace(request.WorkPhone) ? null : request.WorkPhone.Trim();
        }
        if (request.Designation is not null)
        {
            contact.Designation = string.IsNullOrWhiteSpace(request.Designation) ? null : request.Designation.Trim();
        }
        if (request.City is not null)
        {
            contact.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        }
        if (hasDateOfBirthUpdate)
        {
            contact.DateOfBirth = string.IsNullOrWhiteSpace(request.DateOfBirth) ? null : dateOfBirth;
        }
        if (request.InstagramUrl is not null)
        {
            contact.InstagramUrl = string.IsNullOrWhiteSpace(request.InstagramUrl) ? null : request.InstagramUrl.Trim();
        }
        if (request.LinkedinUrl is not null)
        {
            contact.LinkedinUrl = string.IsNullOrWhiteSpace(request.LinkedinUrl) ? null : request.LinkedinUrl.Trim();
        }

        // Keep legacy Phone/Position roughly in sync for compatibility
        if (request.WorkPhone is not null || request.PersonalPhone is not null)
        {
            var work = contact.WorkPhone;
            var personal = contact.PersonalPhone;
            contact.Phone = !string.IsNullOrWhiteSpace(work)
                ? work
                : string.IsNullOrWhiteSpace(personal) ? null : personal;
        }
        if (request.Designation is not null)
        {
            contact.Position = contact.Designation;
        }

        contact.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        // Log contact updated activity (User Story 3)
        if (_current.UserId is Guid actorUserId)
        {
            await _activity.LogContactUpdatedAsync(actorUserId, account.Id, contact.Id, contact.Name ?? originalName);
        }

        return Ok(new
        {
            data = new
            {
                id = contact.Id,
                name = contact.Name,
                email = contact.Email,
                phone = contact.Phone,
                position = contact.Position,
                personalPhone = contact.PersonalPhone,
                workPhone = contact.WorkPhone,
                designation = contact.Designation,
                city = contact.City,
                dateOfBirth = contact.DateOfBirth,
                instagramUrl = contact.InstagramUrl,
                linkedinUrl = contact.LinkedinUrl,
                createdAt = contact.CreatedAt,
                updatedAt = contact.UpdatedAt
            }
        });
    }

    [HttpDelete("{accountId:guid}/contacts/{contactId:guid}")]
    public async Task<ActionResult<object>> DeleteContact(Guid accountId, Guid contactId)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var account = await _db.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && !a.IsDeleted);

        if (account == null)
        {
            return NotFound(new { error = new { code = "ACCOUNT_NOT_FOUND", message = "Account not found" } });
        }

        var role = _current.Role ?? "Basic";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            && account.CreatedByUserId != _current.UserId)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "You are not allowed to modify this account" } });
        }

        var contact = await _db.Contacts.FirstOrDefaultAsync(c => c.Id == contactId && c.AccountId == accountId && !c.IsDeleted);

        if (contact == null)
        {
            return NotFound(new { error = new { code = "CONTACT_NOT_FOUND", message = "Contact not found" } });
        }

        var contactName = contact.Name;

        contact.IsDeleted = true;
        contact.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        // Log contact deleted activity (User Story 3)
        if (_current.UserId is Guid actorUserId)
        {
            await _activity.LogContactDeletedAsync(actorUserId, account.Id, contact.Id, contactName);
        }

        return Ok(new { data = new { id = contact.Id } });
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

        // Spec 17: All users (Basic and Admin) can view all accounts
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

    [HttpGet("{id:guid}/activity")] 
    public async Task<ActionResult<object>> GetAccountActivity(
        Guid id,
        [FromQuery] string? eventTypes,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] Guid? actorId,
        [FromQuery] string? cursor,
        [FromQuery] int? limit)
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

        // Spec 17: All users (Basic and Admin) can view all accounts
        string[]? eventTypeArray = null;
        if (!string.IsNullOrWhiteSpace(eventTypes))
        {
            eventTypeArray = eventTypes
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }

        var (items, nextCursor) = await _activity.GetAccountActivityAsync(
            id,
            eventTypeArray,
            from,
            to,
            actorId,
            cursor,
            limit ?? 50);

        return Ok(new { data = new { items, nextCursor } });
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

        // Spec 17: All users (Basic and Admin) can view all accounts
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

    // Dashboard summary with optional per-user filtering
    [HttpGet("dashboard-summary")]
    public async Task<ActionResult<object>> GetDashboardSummary([FromQuery] string? userIds)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var role = _current.Role ?? "Basic";
        List<Guid>? filterUserIds = null;

        // Allow user filtering only for Admin users
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(userIds))
            {
                filterUserIds = userIds
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => Guid.TryParse(x, out var g) ? (Guid?)g : null)
                    .Where(g => g.HasValue)
                    .Select(g => g!.Value)
                    .Distinct()
                    .ToList();
            }
        }
        // Basic users now see all data by default (no filtering)

        var accountsQuery = _db.Accounts
            .AsNoTracking()
            .Where(a => !a.IsDeleted);

        if (filterUserIds is { Count: > 0 })
        {
            accountsQuery = accountsQuery.Where(a => filterUserIds.Contains(a.CreatedByUserId));
        }

        var totalAccounts = await accountsQuery.CountAsync();

        var demosQuery = _db.Demos
            .AsNoTracking()
            .Where(d => !d.IsDeleted && d.Account != null && !d.Account.IsDeleted);

        if (filterUserIds is { Count: > 0 })
        {
            demosQuery = demosQuery.Where(d =>
                filterUserIds.Contains(d.DemoAlignedByUserId) ||
                (d.DemoDoneByUserId.HasValue && filterUserIds.Contains(d.DemoDoneByUserId.Value)));
        }

        var demosScheduled = await demosQuery
            .Where(d => d.Status == DemoStatus.Scheduled)
            .CountAsync();

        var demosCompleted = await demosQuery
            .Where(d => d.Status == DemoStatus.Completed)
            .CountAsync();

        return Ok(new
        {
            data = new
            {
                totalAccountsCreated = totalAccounts,
                demosScheduled = demosScheduled,
                demosCompleted = demosCompleted
            }
        });
    }

    private async Task<Guid> ResolveCrmProviderAsync(Guid? crmProviderId, string? crmProviderName)
    {
        if (crmProviderId.HasValue)
        {
            var exists = await _db.CrmProviders.AnyAsync(p => p.Id == crmProviderId.Value);
            if (exists)
            {
                return crmProviderId.Value;
            }
        }

        if (!string.IsNullOrWhiteSpace(crmProviderName))
        {
            var normalizedName = crmProviderName.Trim();
            var existing = await _db.CrmProviders.FirstOrDefaultAsync(p => EF.Functions.ILike(p.Name, normalizedName));
            if (existing != null)
            {
                return existing.Id;
            }

            var nextDisplayOrder = (await _db.CrmProviders.MaxAsync(p => (int?)p.DisplayOrder) ?? 0) + 1;
            var created = new CrmProvider
            {
                Id = Guid.NewGuid(),
                Name = normalizedName,
                DisplayOrder = nextDisplayOrder
            };

            _db.CrmProviders.Add(created);
            await _db.SaveChangesAsync();

            return created.Id;
        }

        var fallback = await _db.CrmProviders.FirstOrDefaultAsync(p => p.Name == "None");
        if (fallback != null)
        {
            return fallback.Id;
        }

        var fallbackDisplayOrder = (await _db.CrmProviders.MaxAsync(p => (int?)p.DisplayOrder) ?? 0) + 1;
        var noneProvider = new CrmProvider
        {
            Id = Guid.NewGuid(),
            Name = "None",
            DisplayOrder = fallbackDisplayOrder
        };

        _db.CrmProviders.Add(noneProvider);
        await _db.SaveChangesAsync();

        return noneProvider.Id;
    }
}
