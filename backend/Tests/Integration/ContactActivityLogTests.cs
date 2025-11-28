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

public class ContactActivityLogTests : IClassFixture<ActivityLogTestFixture>
{
    private readonly ActivityLogTestFixture _fixture;

    public ContactActivityLogTests(ActivityLogTestFixture fixture)
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
    public async Task ContactAddUpdateDelete_EmitContactLifecycleActivityLogs()
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
            CompanyName = "Contact Account",
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

        // Add contact
        var createRequest = new AccountsController.ContactCreateRequest(
            Name: "Alice",
            Email: "alice@example.com",
            PersonalPhone: "123",
            WorkPhone: "456",
            Designation: "Manager",
            City: "City",
            DateOfBirth: null,
            InstagramUrl: null,
            LinkedinUrl: null
        );

        var createResult = await controller.CreateContact(account.Id, createRequest);
        var createOk = Assert.IsType<OkObjectResult>(createResult.Result);
        Assert.NotNull(createOk.Value);

        var addedLog = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .SingleOrDefaultAsync(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "CONTACT_ADDED");

        Assert.NotNull(addedLog);

        var contactId = await db.Contacts.AsNoTracking().Where(c => c.AccountId == account.Id).Select(c => c.Id).SingleAsync();

        // Update contact
        var updateRequest = new AccountsController.ContactUpdateRequest(
            Name: "Alice Updated",
            Email: null,
            PersonalPhone: null,
            WorkPhone: null,
            Designation: null,
            City: null,
            DateOfBirth: null,
            InstagramUrl: null,
            LinkedinUrl: null
        );

        var updateResult = await controller.UpdateContact(account.Id, contactId, updateRequest);
        Assert.IsType<OkObjectResult>(updateResult.Result);

        var updatedLog = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .SingleOrDefaultAsync(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "CONTACT_UPDATED");

        Assert.NotNull(updatedLog);

        // Delete contact
        var deleteResult = await controller.DeleteContact(account.Id, contactId);
        Assert.IsType<OkObjectResult>(deleteResult.Result);

        var deletedLog = await db.ActivityLogs
            .AsNoTracking()
            .Join(db.ActivityTypes.AsNoTracking(), l => l.ActivityTypeId, t => t.Id,
                (l, t) => new { l, t })
            .SingleOrDefaultAsync(x => x.l.EntityType == "Account" && x.l.EntityId == account.Id && x.t.Name == "CONTACT_DELETED");

        Assert.NotNull(deletedLog);
    }
}
