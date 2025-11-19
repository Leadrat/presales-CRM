using System;

namespace Api.Models;

public class OpportunityStage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
