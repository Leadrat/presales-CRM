using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Api.Models;
using Api.Services;

namespace Api.Controllers;

[ApiController]
[Route("api/leaderboard")]
[Authorize]
public class LeaderboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _current;
    private readonly ILogger<LeaderboardController> _logger;

    public LeaderboardController(AppDbContext db, ICurrentUserService current, ILogger<LeaderboardController> logger)
    {
        _db = db;
        _current = current;
        _logger = logger;
    }

    public sealed record LeaderboardDemoBreakdownDto(int Small, int Medium, int Enterprise);

    public sealed record LeaderboardUserDto(
        Guid UserId,
        string Name,
        int AccountsCreated,
        LeaderboardDemoBreakdownDto Demos,
        int Points
    );

    public sealed record LeaderboardResponseDto(
        string Period,
        string StartDate,
        string EndDate,
        IReadOnlyList<LeaderboardUserDto> Users,
        object Scoring
    );

    [HttpGet]
    public async Task<ActionResult<object>> Get([FromQuery] string period)
    {
        if (!_current.IsAuthenticated || _current.UserId is null)
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Not authenticated" } });
        }

        if (string.IsNullOrWhiteSpace(period))
        {
            return BadRequest(new { error = new { code = "INVALID_PERIOD", message = "Query parameter 'period' is required" } });
        }

        var normalized = period.Trim().ToLowerInvariant();
        if (normalized != "weekly" && normalized != "monthly" && normalized != "quarterly")
        {
            return BadRequest(new { error = new { code = "INVALID_PERIOD", message = "Period must be one of: weekly, monthly, quarterly" } });
        }

        var nowUtc = DateTimeOffset.UtcNow;
        var (start, end) = LeaderboardDateRangeHelper.GetDateRange(normalized, nowUtc);

        // Fetch active users
        var usersQuery = _db.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted && u.IsActive);

        var users = await usersQuery
            .Select(u => new { u.Id, u.FullName })
            .ToListAsync();

        var userLookup = users.ToDictionary(u => u.Id, u => u.FullName ?? string.Empty);

        // Accounts created within range
        var accountsInRange = await _db.Accounts
            .AsNoTracking()
            .Where(a => !a.IsDeleted && a.CreatedAt >= start && a.CreatedAt <= end)
            .GroupBy(a => a.CreatedByUserId)
            .Select(g => new
            {
                UserId = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        var accountCounts = accountsInRange
            .Where(x => userLookup.ContainsKey(x.UserId))
            .ToDictionary(x => x.UserId, x => x.Count);

        // Completed demos within range, joined to account size
        _logger.LogInformation($"Fetching demos for period {normalized} ({start:yyyy-MM-dd} to {end:yyyy-MM-dd})");
        
        var demos = await _db.Demos
            .AsNoTracking()
            .Where(d => !d.IsDeleted && d.Status == DemoStatus.Completed && d.DoneAt != null && d.DoneAt >= start && d.DoneAt <= end)
            .Include(d => d.Account)!
                .ThenInclude(a => a!.AccountSize)
            .ToListAsync();
            
        _logger.LogInformation($"Found {demos.Count} completed demos in date range");
        
        // Log detailed information about each demo
        foreach (var demo in demos)
        {
            var accountSize = demo.Account?.AccountSize?.Name ?? "Unknown";
            var accountId = demo.Account?.Id ?? Guid.Empty;
            var accountName = demo.Account?.CompanyName ?? "Unknown";
            var userId = demo.DemoAlignedByUserId;
            var userName = userLookup.TryGetValue(userId, out var name) ? name : "Unknown";
            
            _logger.LogInformation(
                $"Demo ID: {demo.Id}, " +
                $"Account ID: {accountId}, " +
                $"Account Name: {accountName}, " +
                $"Account Size: {accountSize}, " +
                $"Status: {demo.Status}, " +
                $"Done Date: {demo.DoneAt}, " +
                $"DemoAlignedByUserId: {userId}, " +
                $"User Name: {userName}"
            );
        }
        
        var demoRows = demos
            .Select(d => new
            {
                d.DemoAlignedByUserId,
                SizeName = d.Account != null ? d.Account.AccountSize!.Name : null
            })
            .ToList();

        var demoAgg = new Dictionary<Guid, (int small, int medium, int enterprise)>();

        foreach (var row in demoRows)
        {
            if (!userLookup.ContainsKey(row.DemoAlignedByUserId))
            {
                _logger.LogWarning($"Skipping demo for user {row.DemoAlignedByUserId} - user not found or inactive");
                continue; // demo aligned to inactive or unknown user
            }

            var sizeKey = (row.SizeName ?? "Small").Trim().ToLowerInvariant();
            int small = 0, medium = 0, enterprise = 0;

            if (demoAgg.TryGetValue(row.DemoAlignedByUserId, out var existing))
            {
                small = existing.small;
                medium = existing.medium;
                enterprise = existing.enterprise;
            }

            _logger.LogInformation($"Processing demo for user {row.DemoAlignedByUserId} ({userLookup[row.DemoAlignedByUserId]}) with size: {sizeKey}");
            
            switch (sizeKey)
            {
                case "medium":
                    medium++;
                    _logger.LogInformation($"Incrementing MEDIUM demo count for user {row.DemoAlignedByUserId}");
                    break;
                case "enterprise":
                    enterprise++;
                    _logger.LogInformation($"Incrementing ENTERPRISE demo count for user {row.DemoAlignedByUserId}");
                    break;
                default:
                    small++;
                    _logger.LogInformation($"Incrementing SMALL demo count for user {row.DemoAlignedByUserId}");
                    break;
            }

            demoAgg[row.DemoAlignedByUserId] = (small, medium, enterprise);
        }

        const int accountPoints = 2;
        const int demoSmallPoints = 2;
        const int demoMediumPoints = 3;
        const int demoEnterprisePoints = 5;

        var resultUsers = new List<LeaderboardUserDto>();

        foreach (var kvp in userLookup)
        {
            var userId = kvp.Key;
            var name = string.IsNullOrWhiteSpace(kvp.Value) ? "(No name)" : kvp.Value;

            accountCounts.TryGetValue(userId, out var accountsCreated);
            demoAgg.TryGetValue(userId, out var demoBreakdown);

            var smallDemos = demoBreakdown.small;
            var mediumDemos = demoBreakdown.medium;
            var enterpriseDemos = demoBreakdown.enterprise;
            
            _logger.LogInformation(
                $"User summary - ID: {userId}, " +
                $"Name: {name}, " +
                $"Accounts: {accountsCreated}, " +
                $"Small Demos: {smallDemos}, " +
                $"Medium Demos: {mediumDemos}, " +
                $"Enterprise Demos: {enterpriseDemos}"
            );

            var points = accountsCreated * accountPoints
                         + smallDemos * demoSmallPoints
                         + mediumDemos * demoMediumPoints
                         + enterpriseDemos * demoEnterprisePoints;

            if (points <= 0)
            {
                _logger.LogInformation($"Skipping user {userId} ({name}) - 0 points");
                continue; // skip 0-point users
            }

            var dto = new LeaderboardUserDto(
                userId,
                name,
                accountsCreated,
                new LeaderboardDemoBreakdownDto(smallDemos, mediumDemos, enterpriseDemos),
                points
            );

            resultUsers.Add(dto);
        }

        // Sorting: points desc, total demos desc, name asc
        resultUsers = resultUsers
            .OrderByDescending(u => u.Points)
            .ThenByDescending(u => u.Demos.Small + u.Demos.Medium + u.Demos.Enterprise)
            .ThenBy(u => u.Name)
            .ToList();

        var response = new LeaderboardResponseDto(
            normalized,
            start.UtcDateTime.ToString("yyyy-MM-dd"),
            end.UtcDateTime.ToString("yyyy-MM-dd"),
            resultUsers,
            new
            {
                accountCreated = accountPoints,
                demoSmall = demoSmallPoints,
                demoMedium = demoMediumPoints,
                demoEnterprise = demoEnterprisePoints
            }
        );

        return Ok(new { data = response });
    }
}
