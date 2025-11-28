using System;

namespace Api.Models;

public class Demo
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }
    public Guid DemoAlignedByUserId { get; set; }
    public Guid? DemoDoneByUserId { get; set; }

    public DateTimeOffset ScheduledAt { get; set; }
    public DateTimeOffset? DoneAt { get; set; }

    public string? Attendees { get; set; }
    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    public Account? Account { get; set; }
    public User? DemoAlignedByUser { get; set; }
    public User? DemoDoneByUser { get; set; }
}
