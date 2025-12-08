using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Models;
using Api.Services;

namespace Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _current;

    public AnalyticsController(AppDbContext db, ICurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    private static (DateTimeOffset? from, DateTimeOffset? to) ParseDateRange(string? fromRaw, string? toRaw)
    {
        DateTimeOffset? from = null;
        DateTimeOffset? to = null;

        if (!string.IsNullOrWhiteSpace(fromRaw) &&
            DateTimeOffset.TryParse(fromRaw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var fromParsed))
        {
            from = fromParsed.UtcDateTime;
        }

        if (!string.IsNullOrWhiteSpace(toRaw) &&
            DateTimeOffset.TryParse(toRaw, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var toParsed))
        {
            var toValue = toParsed.UtcDateTime;

            // Inclusive upper bound – if the user supplied a date-only value, extend to end of that day
            var isDateOnlyInput = !toRaw.Contains("T", StringComparison.OrdinalIgnoreCase) && toParsed.TimeOfDay == TimeSpan.Zero;
            if (isDateOnlyInput)
            {
                toValue = toValue.AddDays(1).AddTicks(-1);
            }

            to = toValue;
        }

        return (from, to);
    }

    private static bool IsRangeTooWide(DateTimeOffset? from, DateTimeOffset? to)
    {
        if (!from.HasValue || !to.HasValue) return false;

        // Allow up to ~12 months between from and to
        var span = to.Value - from.Value;
        return span > TimeSpan.FromDays(366);
    }

    private static IQueryable<T> ApplyDateRange<T>(IQueryable<T> query, Func<T, DateTimeOffset> selector, DateTimeOffset? from, DateTimeOffset? to)
    {
        if (from.HasValue)
        {
            query = query.Where(e => selector(e) >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(e => selector(e) <= to.Value);
        }

        return query;
    }

    private static string GetSizeBucket(int numberOfUsers)
    {
        if (numberOfUsers <= 0) return "none";
        if (numberOfUsers <= 9) return "little";
        if (numberOfUsers <= 24) return "small";
        if (numberOfUsers <= 49) return "medium";
        return "enterprise";
    }

    [HttpGet("accounts")]
    public async Task<ActionResult<object>> GetAccountAnalytics([FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? userIds, [FromQuery] Guid? userId)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var (fromDate, toDate) = ParseDateRange(from, to);

        if (IsRangeTooWide(fromDate, toDate))
        {
            return BadRequest(new { error = new { code = "INVALID_DATE_RANGE", message = "Date range cannot exceed 12 months." } });
        }

        var role = _current.Role ?? "Basic";
        List<Guid>? filterUserIds = null;

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
            else if (userId.HasValue)
            {
                filterUserIds = new List<Guid> { userId.Value };
            }
        }
        else if (_current.UserId is Guid currentUserId)
        {
            filterUserIds = new List<Guid> { currentUserId };
        }

        var accounts = _db.Accounts
            .AsNoTracking()
            .Where(a => !a.IsDeleted);

        if (filterUserIds is { Count: > 0 })
        {
            accounts = accounts.Where(a => a.CreatedByUserId.HasValue && filterUserIds.Contains(a.CreatedByUserId.Value));
        }

        // If no date range is provided, return lifetime totals explicitly (mirrors dashboard-summary semantics)
        if (!fromDate.HasValue && !toDate.HasValue)
        {
            var createdLifetime = await accounts.CountAsync();

            // For modified lifetime, reuse accounts (every non-deleted account has some UpdatedAt)
            var modifiedLifetime = await accounts.CountAsync();

            var bookedLifetime = await accounts
                .Where(a => a.DealStage == "WON" && a.ClosedDate != null)
                .CountAsync();

            var lostLifetime = await accounts
                .Where(a => a.DealStage == "LOST" && a.ClosedDate != null)
                .CountAsync();

            return Ok(new
            {
                data = new
                {
                    created = createdLifetime,
                    modified = modifiedLifetime,
                    booked = bookedLifetime,
                    lost = lostLifetime
                }
            });
        }

        // Date range provided – apply filters field-by-field

        // Created
        var createdQuery = accounts;
        if (fromDate.HasValue)
        {
            createdQuery = createdQuery.Where(a => a.CreatedAt >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            createdQuery = createdQuery.Where(a => a.CreatedAt <= toDate.Value);
        }
        var created = await createdQuery.CountAsync();

        // Modified
        var modifiedQuery = accounts;
        if (fromDate.HasValue)
        {
            modifiedQuery = modifiedQuery.Where(a => a.UpdatedAt >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            modifiedQuery = modifiedQuery.Where(a => a.UpdatedAt <= toDate.Value);
        }
        var modified = await modifiedQuery.CountAsync();

        // Booked (Closed Won) – use ClosedDate in range
        var bookedQuery = accounts.Where(a => a.DealStage == "WON" && a.ClosedDate != null);
        if (fromDate.HasValue)
        {
            bookedQuery = bookedQuery.Where(a => a.ClosedDate >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            bookedQuery = bookedQuery.Where(a => a.ClosedDate <= toDate.Value);
        }
        var booked = await bookedQuery.CountAsync();

        // Lost – DealStage == LOST and ClosedDate in range
        var lostQuery = accounts.Where(a => a.DealStage == "LOST" && a.ClosedDate != null);
        if (fromDate.HasValue)
        {
            lostQuery = lostQuery.Where(a => a.ClosedDate >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            lostQuery = lostQuery.Where(a => a.ClosedDate <= toDate.Value);
        }
        var lost = await lostQuery.CountAsync();

        return Ok(new
        {
            data = new
            {
                created,
                modified,
                booked,
                lost
            }
        });
    }

    [HttpGet("demos-by-size")]
    public async Task<ActionResult<object>> GetDemosBySize([FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? userIds, [FromQuery] Guid? userId)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        var (fromDate, toDate) = ParseDateRange(from, to);

        var role = _current.Role ?? "Basic";
        List<Guid>? filterUserIds = null;

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
            else if (userId.HasValue)
            {
                filterUserIds = new List<Guid> { userId.Value };
            }
        }
        else if (_current.UserId is Guid currentUserId)
        {
            filterUserIds = new List<Guid> { currentUserId };
        }

        var demos = _db.Demos
            .AsNoTracking()
            .Where(d => !d.IsDeleted && d.Account != null && !d.Account.IsDeleted);

        if (filterUserIds is { Count: > 0 })
        {
            demos = demos.Where(d =>
                filterUserIds.Contains(d.DemoAlignedByUserId) ||
                (d.DemoDoneByUserId.HasValue && filterUserIds.Contains(d.DemoDoneByUserId.Value)));
        }

        // Apply date range based on demo timestamp (ScheduledAt for Scheduled, DoneAt for Completed)
        if (fromDate.HasValue || toDate.HasValue)
        {
            demos = demos.Where(d =>
                (d.Status == DemoStatus.Scheduled && (!fromDate.HasValue || d.ScheduledAt >= fromDate.Value) && (!toDate.HasValue || d.ScheduledAt <= toDate.Value)) ||
                (d.Status == DemoStatus.Completed && d.DoneAt != null && (!fromDate.HasValue || d.DoneAt >= fromDate.Value) && (!toDate.HasValue || d.DoneAt <= toDate.Value))
            );
        }

        // Materialize to memory first so that GetSizeBucket runs on the client,
        // not inside the SQL translation (EF Core cannot translate this helper).
        var raw = await demos
            .Where(d => d.Account != null)
            .Select(d => new
            {
                d.Account!.NumberOfUsers
            })
            .ToListAsync();

        var grouped = raw
            .GroupBy(x => GetSizeBucket(x.NumberOfUsers))
            .Select(g => new { Size = g.Key, Count = g.Count() })
            .ToList();

        int little = 0, small = 0, medium = 0, enterprise = 0;
        foreach (var row in grouped)
        {
            switch (row.Size)
            {
                case "little":
                    little = row.Count;
                    break;
                case "small":
                    small = row.Count;
                    break;
                case "medium":
                    medium = row.Count;
                    break;
                case "enterprise":
                    enterprise = row.Count;
                    break;
            }
        }

        return Ok(new
        {
            data = new
            {
                little,
                small,
                medium,
                enterprise
            }
        });
    }
}
