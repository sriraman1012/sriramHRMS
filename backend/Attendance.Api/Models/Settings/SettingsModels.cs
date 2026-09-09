namespace Attendance.Api.Models.Settings;

public class WeeklyOffResponse
{
    // Weekdays off EVERY week (JS: 0=Sun .. 6=Sat)
    public List<int> Days { get; set; } = new();
    // Weekday -> occurrences off (e.g. {6:[2,4]} = 2nd & 4th Saturday)
    public Dictionary<int, List<int>> Nth { get; set; } = new();
}

public class WeeklyOffRequest
{
    public List<int> Days { get; set; } = new();
    public Dictionary<int, List<int>>? Nth { get; set; }
}

// Maps SP_AppSetting_Get result.
public class AppSettingDto
{
    public string SettingKey { get; set; } = string.Empty;
    public string? SettingValue { get; set; }
}

public class WorkingDaysRequest
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int WorkingDays { get; set; }
}
