using System;

namespace Api.Models.Interfaces
{
    public interface IOwnedEntity
    {
        Guid CreatedBy { get; set; }
    }
}
