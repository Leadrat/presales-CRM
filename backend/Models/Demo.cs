using System;

namespace Api.Models;

/// <summary>
/// Demo status values: Scheduled, Completed, Cancelled, NoShow
/// </summary>
public static class DemoStatus
{
    public const string Scheduled = "Scheduled";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string NoShow = "NoShow";

    public static readonly string[] All = { Scheduled, Completed, Cancelled, NoShow };

    public static bool IsValid(string? status) =>
        !string.IsNullOrEmpty(status) && Array.Exists(All, s => s.Equals(status, StringComparison.OrdinalIgnoreCase));
}

public class Demo
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }
    
    /// <summary>
    /// User who scheduled/aligned the demo
    /// </summary>
    public Guid DemoAlignedByUserId { get; set; }
    
    /// <summary>
    /// User who completed the demo (set when status = Completed)
    /// </summary>
    public Guid? DemoDoneByUserId { get; set; }

    public DateTimeOffset ScheduledAt { get; set; }
    
    /// <summary>
    /// When the demo was actually completed (set when status = Completed)
    /// </summary>
    public DateTimeOffset? DoneAt { get; set; }

    /// <summary>
    /// Demo status: Scheduled, Completed, Cancelled, NoShow
    /// </summary>
    public string Status { get; set; } = DemoStatus.Scheduled;

    public string? Attendees { get; set; }
    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    public Account? Account { get; set; }
    public User? DemoAlignedByUser { get; set; }
    public User? DemoDoneByUser { get; set; }
}
