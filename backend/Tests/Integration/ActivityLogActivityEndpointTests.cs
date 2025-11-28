using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Api;
using Api.Controllers;
using Api.Models;
using Api.Models.Interfaces;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Api.Tests.Integration;

public class ActivityLogActivityEndpointTests : IClassFixture<ActivityLogTestFixture>
{
    private readonly ActivityLogTestFixture _fixture;

    public ActivityLogActivityEndpointTests(ActivityLogTestFixture fixture)
    {
        _fixture = fixture;
    }

    private static AccountsController CreateController(AppDbContext db, Guid userId)
    {
        var currentUser = ActivityLogTestFixture.CreateCurrentUser(userId, role: "Admin");
        var activityService = new ActivityLogService(db);
        return new AccountsController(db, currentUser, activityService);
    }

    [Fact]
    public async Task GetAccountActivity_ReturnsEntriesOrderedByCreatedAtDescending()
    {
        await using var db = _fixture.CreateContext();

        var userId = Guid.NewGuid();
        var accountId = Guid.NewGuid();

        var user = new User
        {
            Id = userId,
            Email = "user@example.com",
            PasswordHash = "hash",
            FullName = "Test User"
        };

        var account = new Account
        {
            Id = accountId,
            CompanyName = "Ordered Account",
            AccountTypeId = Guid.NewGuid(),
            AccountSizeId = Guid.NewGuid(),
            CurrentCrmId = Guid.NewGuid(),
            CrmExpiry = DateTimeOffset.UtcNow.AddMonths(1),
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            IsDeleted = false
        };

        var type = new ActivityType { Id = Guid.NewGuid(), Name = "ACCOUNT_UPDATED" };

        var now = DateTimeOffset.UtcNow;

        var logs = new List<ActivityLog>
        {
            new() { Id = Guid.NewGuid(), ActorUserId = userId, EntityType = "Account", EntityId = accountId, ActivityTypeId = type.Id, Message = "Third", CreatedAt = now.AddMinutes(-3) },
            new() { Id = Guid.NewGuid(), ActorUserId = userId, EntityType = "Account", EntityId = accountId, ActivityTypeId = type.Id, Message = "First", CreatedAt = now },
            new() { Id = Guid.NewGuid(), ActorUserId = userId, EntityType = "Account", EntityId = accountId, ActivityTypeId = type.Id, Message = "Second", CreatedAt = now.AddMinutes(-1) }
        };

        db.Users.Add(user);
        db.Accounts.Add(account);
        db.ActivityTypes.Add(type);
        db.ActivityLogs.AddRange(logs);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId);

        var result = await controller.GetAccountActivity(accountId, eventTypes: null, from: null, to: null, actorId: null, cursor: null, limit: 50);
        var ok = Assert.IsType<OkObjectResult>(result.Result);

        var value = ok.Value!;
        var dataProp = value.GetType().GetProperty("data");
        Assert.NotNull(dataProp);
        var data = dataProp!.GetValue(value)!;

        var itemsProp = data.GetType().GetProperty("items");
        Assert.NotNull(itemsProp);
        var rawItems = (IEnumerable<object>?)itemsProp!.GetValue(data);
        Assert.NotNull(rawItems);

        var items = rawItems!.Cast<ActivityLogEntryDto>().ToList();

        Assert.Equal(3, items.Count);
        // Should be ordered by CreatedAt DESC: First (now), Second (now-1), Third (now-3)
        Assert.Equal(new[] { "First", "Second", "Third" }, items.Select(i => i.Description).ToArray());
    }
}
