using System;

namespace Api.Models.Interfaces;

public class AccountDetailDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;

    // Identifiers for lookup entities
    public Guid AccountTypeId { get; set; }
    public Guid AccountSizeId { get; set; }
    public Guid CurrentCrmId { get; set; }

    // Optional scalar fields from the Account
    public string? Website { get; set; }
    public int? NumberOfUsers { get; set; }

    // Spec 11: enriched profile fields for detail view
    public string? WebsiteUrl { get; set; }
    public string? DecisionMakers { get; set; }
    public string? InstagramUrl { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? City { get; set; }

    public string AccountTypeName { get; set; } = string.Empty;
    public string AccountSizeName { get; set; } = string.Empty;
    public string CrmProviderName { get; set; } = string.Empty;

    // Ownership / assignment
    public Guid CreatedByUserId { get; set; }
    // Display name of the user who created this account
    public string? CreatedByUserDisplayName { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public string? AssignedToUserDisplayName { get; set; }

    // Spec 014: pipeline metadata
    public string? LeadSource { get; set; }
    public string? DealStage { get; set; }

    public DateTimeOffset CrmExpiry { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public int ContactCount { get; set; }
    public int DemoCount { get; set; }
    public int NoteCount { get; set; }
    public int OpportunityCount { get; set; }
    public int ActivityCount { get; set; }
}
