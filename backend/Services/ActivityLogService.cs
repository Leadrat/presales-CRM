using Api.Models;
using Api.Models.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class ActivityLogService
{
    private readonly AppDbContext _db;
    public ActivityLogService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(Guid? actorUserId, string entityType, Guid? entityId, string activityTypeName, string message, Guid? correlationId)
    {
        // Ensure ActivityType exists
        var type = _db.ActivityTypes.FirstOrDefault(t => t.Name == activityTypeName);
        if (type == null)
        {
            type = new ActivityType { Id = Guid.NewGuid(), Name = activityTypeName };
            _db.ActivityTypes.Add(type);
            await _db.SaveChangesAsync();
        }

        var log = new ActivityLog
        {
            Id = Guid.NewGuid(),
            ActorUserId = actorUserId,
            EntityType = entityType,
            EntityId = entityId,
            ActivityTypeId = type.Id,
            Message = message,
            CorrelationId = correlationId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.ActivityLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task<(List<ActivityLogEntryDto> Items, string? NextCursor)> GetAccountActivityAsync(
        Guid accountId,
        string[]? eventTypes,
        DateTimeOffset? from,
        DateTimeOffset? to,
        Guid? actorUserId,
        string? cursor,
        int limit)
    {
        var normalizedTypes = eventTypes?.Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim().ToUpperInvariant())
            .ToArray();

        var baseQuery =
            from log in _db.ActivityLogs.AsNoTracking()
            join type in _db.ActivityTypes.AsNoTracking() on log.ActivityTypeId equals type.Id
            join user in _db.Users.AsNoTracking() on log.ActorUserId equals user.Id into users
            from user in users.DefaultIfEmpty()
            where log.EntityType == "Account" && log.EntityId == accountId
            select new { log, type, user };

        if (normalizedTypes is { Length: > 0 })
        {
            baseQuery = baseQuery.Where(x => normalizedTypes.Contains(x.type.Name.ToUpper()));
        }

        if (from.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.log.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.log.CreatedAt <= to.Value);
        }

        if (actorUserId.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.log.ActorUserId == actorUserId.Value);
        }

        if (TryParseCursor(cursor, out var cursorCreatedAt, out var cursorId))
        {
            baseQuery = baseQuery.Where(x =>
                x.log.CreatedAt < cursorCreatedAt ||
                (x.log.CreatedAt == cursorCreatedAt && x.log.Id < cursorId));
        }

        var ordered = baseQuery
            .OrderByDescending(x => x.log.CreatedAt)
            .ThenByDescending(x => x.log.Id);

        var pageSize = limit <= 0 ? 50 : Math.Min(limit, 100);

        var rows = await ordered
            .Take(pageSize + 1)
            .ToListAsync();

        var slice = rows.Take(pageSize).ToList();

        var items = slice
            .Select(x => new ActivityLogEntryDto
            {
                Id = x.log.Id,
                AccountId = accountId,
                EventType = x.type.Name,
                Description = x.log.Message,
                Timestamp = x.log.CreatedAt,
                ActorId = x.log.ActorUserId,
                ActorName = string.IsNullOrWhiteSpace(x.user?.FullName)
                    ? (string.IsNullOrWhiteSpace(x.user?.Email) ? "System" : x.user!.Email)
                    : x.user!.FullName,
                RelatedEntityType = x.log.EntityType,
                RelatedEntityId = x.log.EntityId
            })
            .ToList();

        string? nextCursor = null;
        if (rows.Count > pageSize && slice.Count > 0)
        {
            var lastRow = slice.Last();
            nextCursor = BuildCursor(lastRow.log.CreatedAt, lastRow.log.Id);
        }

        return (items, nextCursor);
    }

    private static string BuildCursor(DateTimeOffset createdAt, Guid id)
    {
        return $"{createdAt.UtcTicks}_{id}";
    }

    private static bool TryParseCursor(string? cursor, out DateTimeOffset createdAt, out Guid id)
    {
        createdAt = default;
        id = default;

        if (string.IsNullOrWhiteSpace(cursor))
        {
            return false;
        }

        var parts = cursor.Split('_', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2)
        {
            return false;
        }

        if (!long.TryParse(parts[0], out var ticks))
        {
            return false;
        }

        if (!Guid.TryParse(parts[1], out id))
        {
            return false;
        }

        createdAt = new DateTimeOffset(ticks, TimeSpan.Zero);
        return true;
    }

    public Task LogDealStageChangedAsync(Guid actorUserId, Guid accountId, string? oldStage, string? newStage, Guid? correlationId = null)
    {
        if (string.Equals(oldStage, newStage, StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        var oldLabel = string.IsNullOrWhiteSpace(oldStage) ? "Not set" : oldStage;
        var newLabel = string.IsNullOrWhiteSpace(newStage) ? "Not set" : newStage;
        var message = $"Deal stage changed from '{oldLabel}' to '{newLabel}'";

        return LogAsync(actorUserId, "Account", accountId, "DEAL_STAGE_CHANGED", message, correlationId);
    }

    public Task LogLeadSourceChangedAsync(Guid actorUserId, Guid accountId, string? oldSource, string? newSource, Guid? correlationId = null)
    {
        if (string.Equals(oldSource, newSource, StringComparison.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        var oldLabel = string.IsNullOrWhiteSpace(oldSource) ? "Not set" : oldSource;
        var newLabel = string.IsNullOrWhiteSpace(newSource) ? "Not set" : newSource;
        var message = $"Lead source changed from '{oldLabel}' to '{newLabel}'";

        return LogAsync(actorUserId, "Account", accountId, "LEAD_SOURCE_CHANGED", message, correlationId);
    }

    public Task LogDecisionMakersChangedAsync(Guid actorUserId, Guid accountId, string? oldValue, string? newValue, Guid? correlationId = null)
    {
        if (string.Equals(oldValue, newValue, StringComparison.Ordinal))
        {
            return Task.CompletedTask;
        }

        var oldLabel = string.IsNullOrWhiteSpace(oldValue) ? "(empty)" : oldValue;
        var newLabel = string.IsNullOrWhiteSpace(newValue) ? "(empty)" : newValue;
        var message = $"Decision makers changed from '{oldLabel}' to '{newLabel}'";

        return LogAsync(actorUserId, "Account", accountId, "DECISION_MAKERS_CHANGED", message, correlationId);
    }

    // Contact lifecycle

    public Task LogContactAddedAsync(Guid actorUserId, Guid accountId, Guid contactId, string contactName, Guid? correlationId = null)
    {
        var safeName = string.IsNullOrWhiteSpace(contactName) ? "(unnamed contact)" : contactName;
        var message = $"Contact added: {safeName}";
        return LogAsync(actorUserId, "Account", accountId, "CONTACT_ADDED", message, correlationId);
    }

    public Task LogContactUpdatedAsync(Guid actorUserId, Guid accountId, Guid contactId, string contactName, Guid? correlationId = null)
    {
        var safeName = string.IsNullOrWhiteSpace(contactName) ? "(unnamed contact)" : contactName;
        var message = $"Contact updated: {safeName}";
        return LogAsync(actorUserId, "Account", accountId, "CONTACT_UPDATED", message, correlationId);
    }

    public Task LogContactDeletedAsync(Guid actorUserId, Guid accountId, Guid contactId, string contactName, Guid? correlationId = null)
    {
        var safeName = string.IsNullOrWhiteSpace(contactName) ? "(unnamed contact)" : contactName;
        var message = $"Contact deleted: {safeName}";
        return LogAsync(actorUserId, "Account", accountId, "CONTACT_DELETED", message, correlationId);
    }

    // Demo lifecycle

    public Task LogDemoScheduledAsync(Guid actorUserId, Guid accountId, Guid demoId, DateTimeOffset scheduledAt, Guid? correlationId = null)
    {
        var message = $"Demo scheduled at {scheduledAt:O}";
        return LogAsync(actorUserId, "Account", accountId, "DEMO_SCHEDULED", message, correlationId);
    }

    public Task LogDemoUpdatedAsync(Guid actorUserId, Guid accountId, Guid demoId, Guid? correlationId = null)
    {
        var message = "Demo details updated";
        return LogAsync(actorUserId, "Account", accountId, "DEMO_UPDATED", message, correlationId);
    }

    public Task LogDemoCompletedAsync(Guid actorUserId, Guid accountId, Guid demoId, DateTimeOffset? doneAt, DateTimeOffset scheduledAt, Guid? correlationId = null)
    {
        var message = doneAt.HasValue
            ? $"Demo completed (scheduled at {scheduledAt:O}, completed at {doneAt:O})"
            : $"Demo completed (scheduled at {scheduledAt:O})";
        return LogAsync(actorUserId, "Account", accountId, "DEMO_COMPLETED", message, correlationId);
    }

    public Task LogDemoCancelledAsync(Guid actorUserId, Guid accountId, Guid demoId, Guid? correlationId = null)
    {
        var message = "Demo cancelled";
        return LogAsync(actorUserId, "Account", accountId, "DEMO_CANCELLED", message, correlationId);
    }

    public Task LogDemoDeletedAsync(Guid actorUserId, Guid accountId, Guid demoId, Guid? correlationId = null)
    {
        var message = "Demo deleted";
        return LogAsync(actorUserId, "Account", accountId, "DEMO_DELETED", message, correlationId);
    }
}
