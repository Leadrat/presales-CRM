using System;

namespace Api.Models;

public class Account
{
    public Guid Id { get; set; }

    public string CompanyName { get; set; } = string.Empty;
    
    // Enriched company profile fields (Spec 11)
    public string WebsiteUrl { get; set; } = string.Empty;
    public string DecisionMakers { get; set; } = string.Empty;
    public int NumberOfUsers { get; set; }
    public string InstagramUrl { get; set; } = string.Empty;
    public string LinkedinUrl { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    public Guid AccountTypeId { get; set; }
    public Guid AccountSizeId { get; set; }
    public Guid CurrentCrmId { get; set; }
    public DateTimeOffset? CrmExpiry { get; set; }

    public DateTimeOffset? ClosedDate { get; set; }

    // Spec 014: basic pipeline metadata
    public string? LeadSource { get; set; }
    public string DealStage { get; set; } = string.Empty;

    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    public AccountType? AccountType { get; set; }
    public AccountSize? AccountSize { get; set; }
    public CrmProvider? CurrentCrm { get; set; }
    public User? CreatedByUser { get; set; }
    public User? AssignedToUser { get; set; }
}
