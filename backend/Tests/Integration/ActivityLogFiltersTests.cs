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
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests.Integration;

public class ActivityLogFiltersTests : IClassFixture<ActivityLogTestFixture>
{
    private readonly ActivityLogTestFixture _fixture;

    public ActivityLogFiltersTests(ActivityLogTestFixture fixture)
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
    public async Task GetAccountActivity_FiltersByEventTypesAndDateRange()
    {
        await using var db = _fixture.CreateContext();

        var userId = Guid.NewGuid();
        var accountId = Guid.NewGuid();

        var user = new User
        {
            Id = userId,
            FullName = "Test User",
            Email = "user@example.com",
            PasswordHash = "hash",
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var account = new Account
        {
            Id = accountId,
            CompanyName = "Test Account",
            AccountTypeId = Guid.NewGuid(),
            AccountSizeId = Guid.NewGuid(),
            CurrentCrmId = Guid.NewGuid(),
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-5),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-5),
            CrmExpiry = DateTimeOffset.UtcNow.AddMonths(1),
            IsDeleted = false
        };

        var typeDealStage = new ActivityType { Id = Guid.NewGuid(), Name = "DEAL_STAGE_CHANGED" };
        var typeLeadSource = new ActivityType { Id = Guid.NewGuid(), Name = "LEAD_SOURCE_CHANGED" };
        var typeContactAdded = new ActivityType { Id = Guid.NewGuid(), Name = "CONTACT_ADDED" };

        var now = DateTimeOffset.UtcNow;

        var logs = new List<ActivityLog>
        {
            new()
            {
                Id = Guid.NewGuid(),
                ActorUserId = userId,
                EntityType = "Account",
                EntityId = accountId,
                ActivityTypeId = typeDealStage.Id,
                Message = "Deal stage changed",
                CreatedAt = now.AddDays(-2)
            },
            new()
            {
                Id = Guid.NewGuid(),
                ActorUserId = userId,
                EntityType = "Account",
                EntityId = accountId,
                ActivityTypeId = typeLeadSource.Id,
                Message = "Lead source changed",
                CreatedAt = now.AddDays(-1)
            },
            new()
            {
                Id = Guid.NewGuid(),
                ActorUserId = userId,
                EntityType = "Account",
                EntityId = accountId,
                ActivityTypeId = typeContactAdded.Id,
                Message = "Contact added",
                CreatedAt = now.AddDays(-10)
            }
        };

        db.Users.Add(user);
        db.Accounts.Add(account);
        db.ActivityTypes.AddRange(typeDealStage, typeLeadSource, typeContactAdded);
        db.ActivityLogs.AddRange(logs);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId);

        var from = now.AddDays(-3);
        var to = now;
        const string eventTypes = "DEAL_STAGE_CHANGED,LEAD_SOURCE_CHANGED";

        var result = await controller.GetAccountActivity(accountId, eventTypes, from, to, actorId: null, cursor: null, limit: 50);

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

        Assert.Equal(2, items.Count); // contact-added log is outside date range

        // Ensure we only received the requested event types
        Assert.All(items, i => Assert.Contains(i.EventType, new[] { "DEAL_STAGE_CHANGED", "LEAD_SOURCE_CHANGED" }));
    }

    [Fact]
    public async Task GetAccountActivity_FiltersByActorAndPaginatesWithCursor()
    {
        await using var db = _fixture.CreateContext();

        var userA = new User
        {
            Id = Guid.NewGuid(),
            FullName = "User A",
            Email = "usera@example.com",
            PasswordHash = "hash",
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        var userB = new User
        {
            Id = Guid.NewGuid(),
            FullName = "User B",
            Email = "userb@example.com",
            PasswordHash = "hash",
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var accountId = Guid.NewGuid();
        var account = new Account
        {
            Id = accountId,
            CompanyName = "Paged Account",
            AccountTypeId = Guid.NewGuid(),
            AccountSizeId = Guid.NewGuid(),
            CurrentCrmId = Guid.NewGuid(),
            CreatedByUserId = userA.Id,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            CrmExpiry = DateTimeOffset.UtcNow.AddMonths(1),
            IsDeleted = false
        };

        var typeDemoScheduled = new ActivityType { Id = Guid.NewGuid(), Name = "DEMO_SCHEDULED" };

        var now = DateTimeOffset.UtcNow;

        var logs = new List<ActivityLog>();
        for (var i = 0; i < 5; i++)
        {
            logs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                ActorUserId = i % 2 == 0 ? userA.Id : userB.Id,
                EntityType = "Account",
                EntityId = accountId,
                ActivityTypeId = typeDemoScheduled.Id,
                Message = $"Demo scheduled #{i}",
                CreatedAt = now.AddMinutes(-i)
            });
        }

        db.Users.AddRange(userA, userB);
        db.Accounts.Add(account);
        db.ActivityTypes.Add(typeDemoScheduled);
        db.ActivityLogs.AddRange(logs);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userA.Id);

        // Page 1: filter by actor userA, limit 2
        var firstPageResult = await controller.GetAccountActivity(accountId, eventTypes: null, from: null, to: null, actorId: userA.Id, cursor: null, limit: 2);
        var firstOk = Assert.IsType<OkObjectResult>(firstPageResult.Result);

        var firstValue = firstOk.Value!;
        var firstDataProp = firstValue.GetType().GetProperty("data");
        Assert.NotNull(firstDataProp);
        var firstData = firstDataProp!.GetValue(firstValue)!;

        var firstItemsProp = firstData.GetType().GetProperty("items");
        Assert.NotNull(firstItemsProp);
        var firstRawItems = (IEnumerable<object>?)firstItemsProp!.GetValue(firstData);
        Assert.NotNull(firstRawItems);

        var firstItems = firstRawItems!.Cast<ActivityLogEntryDto>().ToList();

        var firstCursorProp = firstData.GetType().GetProperty("nextCursor");
        Assert.NotNull(firstCursorProp);
        var nextCursor = (string?)firstCursorProp!.GetValue(firstData);

        Assert.Equal(2, firstItems.Count);
        Assert.NotNull(nextCursor);
        Assert.All(firstItems, i => Assert.Equal(userA.Id, i.ActorId));

        // Page 2: using cursor, still filtered by actor userA
        var secondPageResult = await controller.GetAccountActivity(accountId, eventTypes: null, from: null, to: null, actorId: userA.Id, cursor: nextCursor, limit: 2);
        var secondOk = Assert.IsType<OkObjectResult>(secondPageResult.Result);

        var secondValue = secondOk.Value!;
        var secondDataProp = secondValue.GetType().GetProperty("data");
        Assert.NotNull(secondDataProp);
        var secondData = secondDataProp!.GetValue(secondValue)!;

        var secondItemsProp = secondData.GetType().GetProperty("items");
        Assert.NotNull(secondItemsProp);
        var secondRawItems = (IEnumerable<object>?)secondItemsProp!.GetValue(secondData);
        Assert.NotNull(secondRawItems);

        var secondItems = secondRawItems!.Cast<ActivityLogEntryDto>().ToList();

        // Together, pages should contain all logs for userA and none for userB
        var totalUserALogs = logs.Count(l => l.ActorUserId == userA.Id);
        var combined = firstItems.Concat(secondItems).ToList();
        Assert.Equal(totalUserALogs, combined.Count);
        Assert.All(combined, i => Assert.Equal(userA.Id, i.ActorId));
    }
}
