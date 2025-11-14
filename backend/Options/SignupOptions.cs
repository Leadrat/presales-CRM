namespace Api.Options;

public class SignupOptions
{
    public string? AllowedDomains { get; set; }

    public HashSet<string> GetDomains()
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(AllowedDomains)) return set;
        foreach (var part in AllowedDomains.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var d = part.Trim().ToLowerInvariant();
            if (!string.IsNullOrEmpty(d)) set.Add(d);
        }
        return set;
    }
}
