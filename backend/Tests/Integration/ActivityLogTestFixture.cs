using System;
using Api;
using Api.Models;
using Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Tests.Integration;

public sealed class ActivityLogTestFixture
{
    public DbContextOptions<AppDbContext> CreateOptions()
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"ActivityLogTests_{Guid.NewGuid()}")
            .Options;
    }

    public AppDbContext CreateContext()
    {
        var options = CreateOptions();
        var context = new AppDbContext(options);
        return context;
    }

    public static ActivityLogService CreateActivityLogService(AppDbContext context)
    {
        return new ActivityLogService(context);
    }

    public static ICurrentUserService CreateCurrentUser(Guid userId, string role = "Admin")
    {
        return new TestCurrentUserService(userId, role);
    }

    private sealed class TestCurrentUserService : ICurrentUserService
    {
        public TestCurrentUserService(Guid userId, string role)
        {
            IsAuthenticated = true;
            UserId = userId;
            Role = role;
        }

        public bool IsAuthenticated { get; }
        public Guid? UserId { get; }
        public string? Role { get; }
    }
}
