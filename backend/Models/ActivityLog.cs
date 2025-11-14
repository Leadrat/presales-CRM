namespace Api.Models;

public class ActivityLog
{
    public Guid Id { get; set; }
    public Guid? ActorUserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public Guid ActivityTypeId { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? CorrelationId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
