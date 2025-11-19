using System;
using Api.Models.Interfaces;

namespace Api.Models
{
    public class Note : IOwnedEntity
    {
        public Guid Id { get; set; }

        // Parent account this note belongs to
        public Guid AccountId { get; set; }

        public string Title { get; set; } = string.Empty;

        // Ownership (required by IOwnedEntity)
        public Guid CreatedBy { get; set; }

        // Audit & soft delete
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
    }
}
