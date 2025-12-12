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

public class LeaderboardControllerTests : IClassFixture<LeaderboardTestFixture>
{
    private readonly LeaderboardTestFixture _fixture;

    public LeaderboardControllerTests(LeaderboardTestFixture fixture)
    {
        _fixture = fixture;
    }

    private static LeaderboardController CreateController(AppDbContext db, Guid userId, string role = "Admin")
    {
        var currentUser = LeaderboardTestFixture.CreateCurrentUser(userId, role);
        return new LeaderboardController(db, currentUser);
    }

    [Fact]
    public async Task Get_ReturnsUnauthorized_WhenUserNotAuthenticated()
    {
        // Arrange
        await using var db = _fixture.CreateContext();
        var controller = new LeaderboardController(db, new TestCurrentUserService(null, null));

        // Act
        var result = await controller.Get("weekly");

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public async Task Get_ReturnsBadRequest_WhenPeriodIsInvalid()
    {
        // Arrange
        await using var db = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var controller = CreateController(db, userId);

        // Act
        var result = await controller.Get("invalid_period");

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Get_ReturnsCorrectScoring_ForAccountsAndDemos()
    {
        // Arrange
        await using var db = _fixture.CreateContext();

        var now = DateTimeOffset.UtcNow;
        var thisWeekStart = LeaderboardDateRangeHelper.GetDateRange("weekly", now).startDate;
        
        // Create account sizes
        var smallSize = new AccountSize { Id = Guid.NewGuid(), Name = "Small" };
        var mediumSize = new AccountSize { Id = Guid.NewGuid(), Name = "Medium" };
        var enterpriseSize = new AccountSize { Id = Guid.NewGuid(), Name = "Enterprise" };
        
        // Create users
        var userA = new User
        {
            Id = Guid.NewGuid(),
            FullName = "User A",
            Email = "usera@example.com",
            PasswordHash = "hash",
            IsActive = true,
            IsDeleted = false,
            CreatedAt = now.AddDays(-30),
            UpdatedAt = now.AddDays(-30)
        };
        
        var userB = new User
        {
            Id = Guid.NewGuid(),
            FullName = "User B",
            Email = "userb@example.com",
            PasswordHash = "hash",
            IsActive = true,
            IsDeleted = false,
            CreatedAt = now.AddDays(-30),
            UpdatedAt = now.AddDays(-30)
        };
        
        var inactiveUser = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Inactive User",
            Email = "inactive@example.com",
            PasswordHash = "hash",
            IsActive = false,
            IsDeleted = false,
            CreatedAt = now.AddDays(-30),
            UpdatedAt = now.AddDays(-30)
        };

        // Create accounts
        var accountsForUserA = new List<Account>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "A Company 1",
                CreatedByUserId = userA.Id,
                CreatedAt = thisWeekStart.AddHours(1), // This week
                UpdatedAt = thisWeekStart.AddHours(1),
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "A Company 2",
                CreatedByUserId = userA.Id,
                CreatedAt = thisWeekStart.AddHours(2), // This week
                UpdatedAt = thisWeekStart.AddHours(2),
                IsDeleted = false
            }
        };
        
        var accountsForUserB = new List<Account>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "B Company 1",
                CreatedByUserId = userB.Id,
                CreatedAt = thisWeekStart.AddHours(1), // This week
                UpdatedAt = thisWeekStart.AddHours(1),
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "B Old Company",
                CreatedByUserId = userB.Id,
                CreatedAt = thisWeekStart.AddDays(-10), // Not this week
                UpdatedAt = thisWeekStart.AddDays(-10),
                IsDeleted = false
            }
        };
        
        var accountsForInactiveUser = new List<Account>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CompanyName = "Inactive Company",
                CreatedByUserId = inactiveUser.Id,
                CreatedAt = thisWeekStart.AddHours(1), // This week
                UpdatedAt = thisWeekStart.AddHours(1),
                IsDeleted = false
            }
        };

        // Create demos
        var demosForUserA = new List<Demo>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "A Demo 1",
                AccountId = accountsForUserA[0].Id,
                DemoAlignedByUserId = userA.Id,
                Status = "Completed",
                DoneAt = thisWeekStart.AddHours(3), // This week
                CreatedAt = thisWeekStart.AddHours(2),
                UpdatedAt = thisWeekStart.AddHours(3),
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "A Demo 2 (Medium)",
                AccountId = accountsForUserA[1].Id,
                DemoAlignedByUserId = userA.Id,
                Status = "Completed",
                DoneAt = thisWeekStart.AddHours(4), // This week
                CreatedAt = thisWeekStart.AddHours(3),
                UpdatedAt = thisWeekStart.AddHours(4),
                IsDeleted = false
            }
        };
        
        var demosForUserB = new List<Demo>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "B Demo 1 (Enterprise)",
                AccountId = accountsForUserB[0].Id,
                DemoAlignedByUserId = userB.Id,
                Status = "Completed",
                DoneAt = thisWeekStart.AddHours(3), // This week
                CreatedAt = thisWeekStart.AddHours(2),
                UpdatedAt = thisWeekStart.AddHours(3),
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "B Demo 2 (Not completed)",
                AccountId = accountsForUserB[0].Id,
                DemoAlignedByUserId = userB.Id,
                Status = "Scheduled", // Not completed
                CreatedAt = thisWeekStart.AddHours(3),
                UpdatedAt = thisWeekStart.AddHours(3),
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "B Demo 3 (Old)",
                AccountId = accountsForUserB[1].Id,
                DemoAlignedByUserId = userB.Id,
                Status = "Completed",
                DoneAt = thisWeekStart.AddDays(-10), // Not this week
                CreatedAt = thisWeekStart.AddDays(-11),
                UpdatedAt = thisWeekStart.AddDays(-10),
                IsDeleted = false
            }
        };
        
        // Set account sizes
        accountsForUserA[0].AccountSizeId = smallSize.Id;
        accountsForUserA[1].AccountSizeId = mediumSize.Id;
        accountsForUserB[0].AccountSizeId = enterpriseSize.Id;
        accountsForUserB[1].AccountSizeId = smallSize.Id;
        accountsForInactiveUser[0].AccountSizeId = smallSize.Id;

        // Add to database
        db.AccountSizes.AddRange(smallSize, mediumSize, enterpriseSize);
        db.Users.AddRange(userA, userB, inactiveUser);
        db.Accounts.AddRange(accountsForUserA);
        db.Accounts.AddRange(accountsForUserB);
        db.Accounts.AddRange(accountsForInactiveUser);
        db.Demos.AddRange(demosForUserA);
        db.Demos.AddRange(demosForUserB);
        await db.SaveChangesAsync();

        // Act
        var controller = CreateController(db, userA.Id);
        var result = await controller.Get("weekly");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var responseValue = okResult.Value;
        
        // Extract data property
        var dataProp = responseValue.GetType().GetProperty("data");
        Assert.NotNull(dataProp);
        var data = dataProp!.GetValue(responseValue);
        
        // Extract users array
        var usersProp = data.GetType().GetProperty("users");
        Assert.NotNull(usersProp);
        var users = (IEnumerable<object>)usersProp!.GetValue(data)!;
        var usersList = users.ToList();
        
        // Should have 2 users (inactive user filtered out)
        Assert.Equal(2, usersList.Count);
        
        // Extract first user (should be userB with more points)
        var firstUser = usersList[0];
        var firstUserIdProp = firstUser.GetType().GetProperty("id");
        var firstUserPointsProp = firstUser.GetType().GetProperty("points");
        var firstUserNameProp = firstUser.GetType().GetProperty("name");
        
        Assert.NotNull(firstUserIdProp);
        Assert.NotNull(firstUserPointsProp);
        Assert.NotNull(firstUserNameProp);
        
        var firstUserId = (Guid)firstUserIdProp!.GetValue(firstUser)!;
        var firstUserPoints = (int)firstUserPointsProp!.GetValue(firstUser)!;
        var firstName = (string)firstUserNameProp!.GetValue(firstUser)!;
        
        // UserB should be first with 7 points (1 account = 2 points, 1 enterprise demo = 5 points)
        Assert.Equal(userB.Id, firstUserId);
        Assert.Equal(7, firstUserPoints); // 2 (account) + 5 (enterprise demo)
        Assert.Equal("User B", firstName);
        
        // Extract second user (should be userA with fewer points)
        var secondUser = usersList[1];
        var secondUserIdProp = secondUser.GetType().GetProperty("id");
        var secondUserPointsProp = secondUser.GetType().GetProperty("points");
        var secondUserNameProp = secondUser.GetType().GetProperty("name");
        
        Assert.NotNull(secondUserIdProp);
        Assert.NotNull(secondUserPointsProp);
        Assert.NotNull(secondUserNameProp);
        
        var secondUserId = (Guid)secondUserIdProp!.GetValue(secondUser)!;
        var secondUserPoints = (int)secondUserPointsProp!.GetValue(secondUser)!;
        var secondName = (string)secondUserNameProp!.GetValue(secondUser)!;
        
        // UserA should be second with 7 points (2 accounts = 4 points, 1 small demo = 2 points, 1 medium demo = 3 points)
        Assert.Equal(userA.Id, secondUserId);
        Assert.Equal(9, secondUserPoints); // 4 (2 accounts) + 2 (small demo) + 3 (medium demo)
        Assert.Equal("User A", secondName);
    }

    [Fact]
    public async Task Get_SortsCorrectly_ByPointsAndDemoCountAndName()
    {
        // Arrange
        await using var db = _fixture.CreateContext();

        var now = DateTimeOffset.UtcNow;
        var thisWeekStart = LeaderboardDateRangeHelper.GetDateRange("weekly", now).startDate;
        
        // Create account sizes
        var smallSize = new AccountSize { Id = Guid.NewGuid(), Name = "Small" };
        
        // Create users with same points but different demo counts and names
        var userA = new User
        {
            Id = Guid.NewGuid(),
            FullName = "User A",
            Email = "usera@example.com",
            PasswordHash = "hash",
            IsActive = true,
            IsDeleted = false,
            CreatedAt = now.AddDays(-30),
            UpdatedAt = now.AddDays(-30)
        };
        
        var userB = new User
        {
            Id = Guid.NewGuid(),
            FullName = "User B",
            Email = "userb@example.com",
            PasswordHash = "hash",
            IsActive = true,
            IsDeleted = false,
            CreatedAt = now.AddDays(-30),
            UpdatedAt = now.AddDays(-30)
        };
        
        var userC = new User
        {
            Id = Guid.NewGuid(),
            FullName = "User C",
            Email = "userc@example.com",
            PasswordHash = "hash",
            IsActive = true,
            IsDeleted = false,
            CreatedAt = now.AddDays(-30),
            UpdatedAt = now.AddDays(-30)
        };

        // Create accounts - one for each user (2 points each)
        var accountA = new Account
        {
            Id = Guid.NewGuid(),
            CompanyName = "A Company",
            AccountSizeId = smallSize.Id,
            CreatedByUserId = userA.Id,
            CreatedAt = thisWeekStart.AddHours(1),
            UpdatedAt = thisWeekStart.AddHours(1),
            IsDeleted = false
        };
        
        var accountB = new Account
        {
            Id = Guid.NewGuid(),
            CompanyName = "B Company",
            AccountSizeId = smallSize.Id,
            CreatedByUserId = userB.Id,
            CreatedAt = thisWeekStart.AddHours(1),
            UpdatedAt = thisWeekStart.AddHours(1),
            IsDeleted = false
        };
        
        var accountC = new Account
        {
            Id = Guid.NewGuid(),
            CompanyName = "C Company",
            AccountSizeId = smallSize.Id,
            CreatedByUserId = userC.Id,
            CreatedAt = thisWeekStart.AddHours(1),
            UpdatedAt = thisWeekStart.AddHours(1),
            IsDeleted = false
        };

        // Create demos - 2 for userA, 1 for userB, 1 for userC (2 points each)
        var demosA = new List<Demo>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "A Demo 1",
                AccountId = accountA.Id,
                DemoAlignedByUserId = userA.Id,
                Status = "Completed",
                DoneAt = thisWeekStart.AddHours(3),
                CreatedAt = thisWeekStart.AddHours(2),
                UpdatedAt = thisWeekStart.AddHours(3),
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "A Demo 2",
                AccountId = accountA.Id,
                DemoAlignedByUserId = userA.Id,
                Status = "Completed",
                DoneAt = thisWeekStart.AddHours(4),
                CreatedAt = thisWeekStart.AddHours(3),
                UpdatedAt = thisWeekStart.AddHours(4),
                IsDeleted = false
            }
        };
        
        var demoB = new Demo
        {
            Id = Guid.NewGuid(),
            Title = "B Demo",
            AccountId = accountB.Id,
            DemoAlignedByUserId = userB.Id,
            Status = "Completed",
            DoneAt = thisWeekStart.AddHours(3),
            CreatedAt = thisWeekStart.AddHours(2),
            UpdatedAt = thisWeekStart.AddHours(3),
            IsDeleted = false
        };
        
        var demoC = new Demo
        {
            Id = Guid.NewGuid(),
            Title = "C Demo",
            AccountId = accountC.Id,
            DemoAlignedByUserId = userC.Id,
            Status = "Completed",
            DoneAt = thisWeekStart.AddHours(3),
            CreatedAt = thisWeekStart.AddHours(2),
            UpdatedAt = thisWeekStart.AddHours(3),
            IsDeleted = false
        };

        // Add to database
        db.AccountSizes.Add(smallSize);
        db.Users.AddRange(userA, userB, userC);
        db.Accounts.AddRange(accountA, accountB, accountC);
        db.Demos.AddRange(demosA);
        db.Demos.Add(demoB);
        db.Demos.Add(demoC);
        await db.SaveChangesAsync();

        // Act
        var controller = CreateController(db, userA.Id);
        var result = await controller.Get("weekly");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var responseValue = okResult.Value;
        
        // Extract data property
        var dataProp = responseValue.GetType().GetProperty("data");
        Assert.NotNull(dataProp);
        var data = dataProp!.GetValue(responseValue);
        
        // Extract users array
        var usersProp = data.GetType().GetProperty("users");
        Assert.NotNull(usersProp);
        var users = (IEnumerable<object>)usersProp!.GetValue(data)!;
        var usersList = users.ToList();
        
        // Should have 3 users
        Assert.Equal(3, usersList.Count);
        
        // Extract user IDs and names in order
        var userIds = new List<Guid>();
        var userNames = new List<string>();
        
        foreach (var user in usersList)
        {
            var idProp = user.GetType().GetProperty("id");
            var nameProp = user.GetType().GetProperty("name");
            Assert.NotNull(idProp);
            Assert.NotNull(nameProp);
            
            userIds.Add((Guid)idProp!.GetValue(user)!);
            userNames.Add((string)nameProp!.GetValue(user)!);
        }
        
        // Expected order:
        // 1. User A (6 points, 2 demos)
        // 2. User B (4 points, 1 demo) - alphabetically before User C
        // 3. User C (4 points, 1 demo)
        Assert.Equal(userA.Id, userIds[0]);
        Assert.Equal(userB.Id, userIds[1]);
        Assert.Equal(userC.Id, userIds[2]);
        
        Assert.Equal("User A", userNames[0]);
        Assert.Equal("User B", userNames[1]);
        Assert.Equal("User C", userNames[2]);
    }
}

public sealed class LeaderboardTestFixture
{
    public DbContextOptions<AppDbContext> CreateOptions()
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"LeaderboardTests_{Guid.NewGuid()}")
            .Options;
    }

    public AppDbContext CreateContext()
    {
        var options = CreateOptions();
        var context = new AppDbContext(options);
        return context;
    }

    public static ICurrentUserService CreateCurrentUser(Guid userId, string role = "Admin")
    {
        return new TestCurrentUserService(userId, role);
    }
}

public class TestCurrentUserService : ICurrentUserService
{
    public TestCurrentUserService(Guid? userId, string? role)
    {
        IsAuthenticated = userId != null;
        UserId = userId;
        Role = role;
    }

    public bool IsAuthenticated { get; }
    public Guid? UserId { get; }
    public string? Role { get; }
}
