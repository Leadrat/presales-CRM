using System;

namespace Api.Models;

public class Opportunity
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public Guid CreatedByUserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public Guid StageId { get; set; }
    public DateTimeOffset? CloseDate { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    // Navigation
    public Account? Account { get; set; }
    public User? CreatedByUser { get; set; }
    public OpportunityStage? Stage { get; set; }
}
