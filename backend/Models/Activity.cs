using System;

namespace Api.Models;

public class Activity
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public Guid CreatedByUserId { get; set; }

    public string Description { get; set; } = string.Empty;
    public Guid ActivityTypeId { get; set; }
    public DateTimeOffset? DueDate { get; set; }
    public Guid StatusId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    // Navigation
    public Account? Account { get; set; }
    public User? CreatedByUser { get; set; }
    public ActivityType? ActivityType { get; set; }
    public ActivityStatus? Status { get; set; }
}
