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

    // Spec 012 — Contact Model Enrichment
    public string? PersonalPhone { get; set; }
    public string? WorkPhone { get; set; }
    public string? Designation { get; set; }
    public string? City { get; set; }
    public DateTimeOffset? DateOfBirth { get; set; }
    public string? InstagramUrl { get; set; }
    public string? LinkedinUrl { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }

    // Navigation
    public Account? Account { get; set; }
    public User? CreatedByUser { get; set; }
}
