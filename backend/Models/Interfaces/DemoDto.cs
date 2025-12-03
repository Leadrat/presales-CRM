using System;

namespace Api.Models.Interfaces;

public class DemoDto
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }

    public DateTimeOffset ScheduledAt { get; set; }
    public DateTimeOffset? DoneAt { get; set; }

    /// <summary>
    /// Demo status: Scheduled, Completed, Cancelled, NoShow
    /// </summary>
    public string Status { get; set; } = "Scheduled";

    public Guid DemoAlignedByUserId { get; set; }
    public string? DemoAlignedByName { get; set; }

    public Guid? DemoDoneByUserId { get; set; }
    public string? DemoDoneByName { get; set; }

    public string? Attendees { get; set; }
    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
