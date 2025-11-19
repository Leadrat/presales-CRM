using System;

namespace Api.Models;

public class ActivityStatus
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
