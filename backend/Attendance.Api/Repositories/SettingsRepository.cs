using System.Data;
using System.Text.Json;
using Attendance.Api.Data;
using Attendance.Api.Models.Settings;
using Dapper;

namespace Attendance.Api.Repositories;

public interface ISettingsRepository
{
    Task<WeeklyOffResponse> GetWeeklyOffAsync();
    Task SaveWeeklyOffAsync(List<int> days, Dictionary<int, List<int>>? nth);
    Task<int?> GetWorkingDaysAsync(int year, int month);
    Task SaveWorkingDaysAsync(int year, int month, int days);
}

public class SettingsRepository : ISettingsRepository
{
    private const string WeeklyOffKey = "WeeklyOffDays";
    private const string WeeklyOffNthKey = "WeeklyOffNth";
    private readonly ISqlConnectionFactory _factory;

    public SettingsRepository(ISqlConnectionFactory factory) => _factory = factory;

    private async Task<string?> GetSettingAsync(IDbConnection db, string key)
    {
        var row = await db.QuerySingleOrDefaultAsync<AppSettingDto>(
            "SP_AppSetting_Get", new { Key = key }, commandType: CommandType.StoredProcedure);
        return row?.SettingValue;
    }

    public async Task<WeeklyOffResponse> GetWeeklyOffAsync()
    {
        using var db = _factory.Create();

        var raw = await GetSettingAsync(db, WeeklyOffKey);
        // Only a missing row defaults to Sun+Sat; a saved value (even empty) is respected.
        var days = raw is null
            ? new List<int> { 0, 6 }
            : raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                 .Select(s => int.TryParse(s, out var n) ? n : -1)
                 .Where(n => n is >= 0 and <= 6).Distinct().OrderBy(n => n).ToList();

        var nthRaw = await GetSettingAsync(db, WeeklyOffNthKey);
        var nth = new Dictionary<int, List<int>>();
        if (!string.IsNullOrWhiteSpace(nthRaw))
        {
            try { nth = JsonSerializer.Deserialize<Dictionary<int, List<int>>>(nthRaw) ?? new(); }
            catch { nth = new(); }
        }

        return new WeeklyOffResponse { Days = days, Nth = nth };
    }

    public async Task SaveWeeklyOffAsync(List<int> days, Dictionary<int, List<int>>? nth)
    {
        var value = string.Join(",", days.Where(d => d is >= 0 and <= 6).Distinct().OrderBy(d => d));
        var nthJson = JsonSerializer.Serialize(nth ?? new Dictionary<int, List<int>>());
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_AppSetting_Set", new { Key = WeeklyOffKey, Value = value }, commandType: CommandType.StoredProcedure);
        await db.ExecuteAsync("SP_AppSetting_Set", new { Key = WeeklyOffNthKey, Value = nthJson }, commandType: CommandType.StoredProcedure);
    }

    public async Task<int?> GetWorkingDaysAsync(int year, int month)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<int?>(
            "SP_WorkingDays_Get", new { Year = year, Month = month }, commandType: CommandType.StoredProcedure);
    }

    public async Task SaveWorkingDaysAsync(int year, int month, int days)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync(
            "SP_WorkingDays_Set", new { Year = year, Month = month, WorkingDays = days }, commandType: CommandType.StoredProcedure);
    }
}
