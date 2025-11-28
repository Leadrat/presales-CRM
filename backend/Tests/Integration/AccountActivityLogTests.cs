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

public class AccountActivityLogTests : IClassFixture<ActivityLogTestFixture>
{
    private readonly ActivityLogTestFixture _fixture;

    public AccountActivityLogTests(ActivityLogTestFixture fixture)
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
    public async Task UpdatingLeadSource_EmitsLeadSourceChangedActivityLog()
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
            CompanyName = "Lead Source Account",
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

        var request = new AccountsController.AccountUpdateRequest(
            CompanyName: account.CompanyName,
            Website: account.WebsiteUrl,
            AccountTypeId: accountTypeId,
            AccountSizeId: accountSizeId,
            CurrentCrmId: crmProviderId,
            NumberOfUsers: account.NumberOfUsers,
            CrmExpiry: "12/30",
            LeadSource: "INSTAGRAM",
            DealStage: account.DealStage,
            DecisionMakers: account.DecisionMakers,
            InstagramUrl: account.InstagramUrl,
            LinkedinUrl: account.LinkedinUrl,
            Phone: account.Phone,
            Email: account.Email
        );

        var result = await controller.Update(account.Id, request);
        Assert.IsType<OkObjectResult>(result.Result);

        var logs = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .Where(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "LEAD_SOURCE_CHANGED")
            .ToListAsync();

        Assert.Single(logs);
        Assert.Equal(userId, logs[0].l.ActorUserId);
        Assert.Equal("LEAD_SOURCE_CHANGED", logs[0].t.Name);
        Assert.Equal("Lead source changed from 'LINKEDIN' to 'INSTAGRAM'", logs[0].l.Message);
    }

    [Fact]
    public async Task UpdatingDealStage_EmitsDealStageChangedActivityLog()
    {
        await using var db = _fixture.CreateContext();

        var userId = Guid.NewGuid();
        var accountTypeId = Guid.NewGuid();
        var accountSizeId = Guid.NewGuid();
        var crmProviderId = Guid.NewGuid();

        var user = new User
        {
            Id = userId,
            Email = "owner2@example.com",
            PasswordHash = "hash",
            FullName = "Owner 2"
        };

        var account = new Account
        {
            Id = Guid.NewGuid(),
            CompanyName = "Deal Stage Account",
            AccountTypeId = accountTypeId,
            AccountSizeId = accountSizeId,
            CurrentCrmId = crmProviderId,
            CrmExpiry = DateTimeOffset.UtcNow.AddMonths(1),
            LeadSource = "LINKEDIN",
            DealStage = "NEW_LEAD",
            DecisionMakers = "Bob",
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            IsDeleted = false
        };

        db.Users.Add(user);
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var controller = CreateController(db, userId);

        var request = new AccountsController.AccountUpdateRequest(
            CompanyName: account.CompanyName,
            Website: account.WebsiteUrl,
            AccountTypeId: accountTypeId,
            AccountSizeId: accountSizeId,
            CurrentCrmId: crmProviderId,
            NumberOfUsers: account.NumberOfUsers,
            CrmExpiry: "12/30",
            LeadSource: account.LeadSource,
            DealStage: "QUALIFIED",
            DecisionMakers: account.DecisionMakers,
            InstagramUrl: account.InstagramUrl,
            LinkedinUrl: account.LinkedinUrl,
            Phone: account.Phone,
            Email: account.Email
        );

        var result = await controller.Update(account.Id, request);
        Assert.IsType<OkObjectResult>(result.Result);

        var logs = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .Where(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "DEAL_STAGE_CHANGED")
            .ToListAsync();

        Assert.Single(logs);
        Assert.Equal(userId, logs[0].l.ActorUserId);
        Assert.Equal("DEAL_STAGE_CHANGED", logs[0].t.Name);
        Assert.Equal("Deal stage changed from 'NEW_LEAD' to 'QUALIFIED'", logs[0].l.Message);
    }
}
