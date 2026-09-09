using System.Data;
using Attendance.Api.Data;
using Attendance.Api.Models.Dashboard;
using Dapper;

namespace Attendance.Api.Repositories;

public interface IDashboardRepository
{
    Task<HomeDashboardResponse> GetHomeAsync(int year, int month, int? departmentId, DateTime today);
    Task<IEnumerable<TrendPointDto>> GetAttendanceTrendAsync(string mode, int? year, int? month, int? departmentId, string? from, string? to);
}

public class DashboardRepository : IDashboardRepository
{
    private readonly ISqlConnectionFactory _factory;
    public DashboardRepository(ISqlConnectionFactory factory) => _factory = factory;

    public async Task<HomeDashboardResponse> GetHomeAsync(int year, int month, int? departmentId, DateTime today)
    {
        using var db = _factory.Create();
        using var grid = await db.QueryMultipleAsync(
            "SP_Dashboard_Home",
            new { Year = year, Month = month, DepartmentId = departmentId, Today = today.Date },
            commandType: CommandType.StoredProcedure);

        var summary = await grid.ReadSingleAsync<HomeSummaryDto>();
        var employeeSummary = (await grid.ReadAsync<EmployeeSummaryDto>()).ToList();
        var departmentPresent = (await grid.ReadAsync<DeptPresentDto>()).ToList();
        // 4th & 5th sets are optional (present only after the SP is re-run).
        var absentLeave = grid.IsConsumed
            ? new List<AbsentLeaveDto>()
            : (await grid.ReadAsync<AbsentLeaveDto>()).ToList();
        var permissionToday = grid.IsConsumed
            ? new List<PermissionTodayDto>()
            : (await grid.ReadAsync<PermissionTodayDto>()).ToList();
        // 6th set (onsite) is optional (present only after the updated SP is run).
        var onsite = grid.IsConsumed
            ? new List<OnsiteDto>()
            : (await grid.ReadAsync<OnsiteDto>()).ToList();

        return new HomeDashboardResponse
        {
            Year = year,
            Month = month,
            Summary = summary,
            EmployeeSummary = employeeSummary,
            DepartmentPresent = departmentPresent,
            AbsentLeave = absentLeave,
            PermissionToday = permissionToday,
            Onsite = onsite,
        };
    }

    public async Task<IEnumerable<TrendPointDto>> GetAttendanceTrendAsync(string mode, int? year, int? month, int? departmentId, string? from, string? to)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<TrendPointDto>(
            "SP_Dashboard_AttendanceTrend",
            new { Mode = mode, Year = year, Month = month, DepartmentId = departmentId, From = from, To = to },
            commandType: CommandType.StoredProcedure);
    }
}
