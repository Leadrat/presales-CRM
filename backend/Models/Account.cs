using System;

namespace Api.Models;

public class Account
{
    public Guid Id { get; set; }

    public string CompanyName { get; set; } = string.Empty;
    public Guid AccountTypeId { get; set; }
    public Guid AccountSizeId { get; set; }
    public Guid CurrentCrmId { get; set; }
    public DateTimeOffset CrmExpiry { get; set; }

    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    public AccountType? AccountType { get; set; }
    public AccountSize? AccountSize { get; set; }
    public CrmProvider? CurrentCrm { get; set; }
    public User? CreatedByUser { get; set; }
}
