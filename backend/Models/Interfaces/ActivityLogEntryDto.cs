using System;

namespace Api.Models.Interfaces;

public class ActivityLogEntryDto
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }

    public string EventType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public DateTimeOffset Timestamp { get; set; }

    public Guid? ActorId { get; set; }
    public string ActorName { get; set; } = string.Empty;

    public string? RelatedEntityType { get; set; }
    public Guid? RelatedEntityId { get; set; }
}
