using System;
using System.Linq;
using System.Threading.Tasks;
using Api;
using Api.Controllers;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests.Integration;

public class DemoActivityLogTests : IClassFixture<ActivityLogTestFixture>
{
    private readonly ActivityLogTestFixture _fixture;

    public DemoActivityLogTests(ActivityLogTestFixture fixture)
    {
        _fixture = fixture;
    }

    private static AccountsController CreateController(AppDbContext db, Guid userId)
    {
        var currentUser = ActivityLogTestFixture.CreateCurrentUser(userId, "Admin");
        var activityService = new ActivityLogService(db);
        return new AccountsController(db, currentUser, activityService);
    }

    [Fact]
    public async Task DemoScheduleCompleteCancel_EmitDemoLifecycleActivityLogs()
    {
        await using var db = _fixture.CreateContext();

        var userId = Guid.NewGuid();
        var accountTypeId = Guid.NewGuid();
        var accountSizeId = Guid.NewGuid();
        var crmProviderId = Guid.NewGuid();

        var user = new User
        {
            Id = userId,
            Email = "owner@example.com",
            PasswordHash = "hash",
            FullName = "Owner"
        };

        var account = new Account
        {
            Id = Guid.NewGuid(),
            CompanyName = "Demo Account",
            AccountTypeId = accountTypeId,
            AccountSizeId = accountSizeId,
            CurrentCrmId = crmProviderId,
            CrmExpiry = DateTimeOffset.UtcNow.AddMonths(1),
            LeadSource = "LINKEDIN",
            DealStage = "NEW_LEAD",
            DecisionMakers = "Alice",
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            IsDeleted = false
        };

        db.Users.Add(user);
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId);

        // Schedule demo
        var scheduledAt = DateTimeOffset.UtcNow.AddDays(1);
        var createRequest = new AccountsController.DemoCreateRequest(
            ScheduledAt: scheduledAt,
            DoneAt: null,
            DemoAlignedByUserId: userId,
            DemoDoneByUserId: null,
            Attendees: "Alice",
            Notes: "Initial demo"
        );

        var createResult = await controller.CreateDemo(account.Id, createRequest);
        var createOk = Assert.IsType<OkObjectResult>(createResult.Result);
        Assert.NotNull(createOk.Value);

        var scheduledLog = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .SingleOrDefaultAsync(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "DEMO_SCHEDULED");

        Assert.NotNull(scheduledLog);

        var demoId = await db.Demos.AsNoTracking().Where(d => d.AccountId == account.Id).Select(d => d.Id).SingleAsync();

        // Complete demo
        var doneAt = DateTimeOffset.UtcNow.AddDays(2);
        var updateRequest = new AccountsController.DemoUpdateRequest(
            ScheduledAt: null,
            DoneAt: doneAt,
            Attendees: null,
            Notes: null
        );

        var updateResult = await controller.UpdateDemo(account.Id, demoId, updateRequest);
        Assert.IsType<OkObjectResult>(updateResult.Result);

        var completedLog = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .SingleOrDefaultAsync(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "DEMO_COMPLETED");

        Assert.NotNull(completedLog);

        // Cancel demo (soft delete)
        var deleteResult = await controller.DeleteDemo(account.Id, demoId);
        Assert.IsType<NoContentResult>(deleteResult);

        var cancelledLog = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .SingleOrDefaultAsync(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "DEMO_CANCELLED");

        Assert.NotNull(cancelledLog);
    }
}
