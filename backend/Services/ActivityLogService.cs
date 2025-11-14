using Api.Models;

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
}
