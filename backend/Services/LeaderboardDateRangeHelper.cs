using System;

namespace Api.Services;

public static class LeaderboardDateRangeHelper
{
    /// <summary>
    /// Compute the UTC start and end (inclusive) for a given period key: weekly, monthly, quarterly.
    /// </summary>
    public static (DateTimeOffset start, DateTimeOffset end) GetDateRange(string period, DateTimeOffset nowUtc)
    {
        var key = (period ?? string.Empty).Trim().ToLowerInvariant();

        return key switch
        {
            "weekly" => GetWeeklyRange(nowUtc),
            "monthly" => GetMonthlyRange(nowUtc),
            "quarterly" => GetQuarterlyRange(nowUtc),
            _ => throw new ArgumentOutOfRangeException(nameof(period), $"Unsupported period '{period}'")
        };
    }

    private static (DateTimeOffset start, DateTimeOffset end) GetWeeklyRange(DateTimeOffset nowUtc)
    {
        // Treat Monday as the first day of week
        var date = nowUtc.Date;
        int diff = ((int)date.DayOfWeek + 6) % 7; // Monday = 1 -> 0, Sunday = 0 -> 6
        var weekStart = date.AddDays(-diff);
        var start = new DateTimeOffset(weekStart, TimeSpan.Zero);
        var end = start.AddDays(7).AddTicks(-1);
        return (start, end);
    }

    private static (DateTimeOffset start, DateTimeOffset end) GetMonthlyRange(DateTimeOffset nowUtc)
    {
        var firstOfMonth = new DateTimeOffset(new DateTime(nowUtc.Year, nowUtc.Month, 1), TimeSpan.Zero);
        var firstOfNextMonth = firstOfMonth.AddMonths(1);
        var end = firstOfNextMonth.AddTicks(-1);
        return (firstOfMonth, end);
    }

    private static (DateTimeOffset start, DateTimeOffset end) GetQuarterlyRange(DateTimeOffset nowUtc)
    {
        int quarterNumber = (nowUtc.Month - 1) / 3; // 0-based
        int startMonth = quarterNumber * 3 + 1;
        var firstOfQuarter = new DateTimeOffset(new DateTime(nowUtc.Year, startMonth, 1), TimeSpan.Zero);
        var firstOfNextQuarter = firstOfQuarter.AddMonths(3);
        var end = firstOfNextQuarter.AddTicks(-1);
        return (firstOfQuarter, end);
    }
}
