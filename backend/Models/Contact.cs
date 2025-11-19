using System;

namespace Api.Models;

public class Contact
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }
    public Guid CreatedByUserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Position { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    // Navigation
    public Account? Account { get; set; }
    public User? CreatedByUser { get; set; }
}
