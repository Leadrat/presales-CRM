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

    public string AccountTypeName { get; set; } = string.Empty;
    public string AccountSizeName { get; set; } = string.Empty;
    public string CrmProviderName { get; set; } = string.Empty;

    public DateTimeOffset CrmExpiry { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public int ContactCount { get; set; }
    public int DemoCount { get; set; }
    public int NoteCount { get; set; }
    public int OpportunityCount { get; set; }
    public int ActivityCount { get; set; }
}
