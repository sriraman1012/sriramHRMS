using System.Data;
using System.Text.Json;
using Attendance.Api.Data;
using Attendance.Api.Models.Attendance;
using Dapper;

namespace Attendance.Api.Repositories;

public interface IAttendanceRepository
{
    Task<AttendanceSheetResponse> GetSheetAsync(int year, int month, int? departmentId);
    Task SaveSheetAsync(SaveSheetRequest req);
    Task<int> CopyPreviousMonthAsync(int year, int month, int? departmentId);
    Task<IEnumerable<BalanceCfDto>> GetBalanceCfAsync(int year, int month);
    Task SaveBalanceCfAsync(BalanceCfSaveRequest req);
    Task<IEnumerable<OnsiteEntryDto>> GetOnsiteAsync(string? from, string? to, int? departmentId);
    Task<IEnumerable<PermissionDto>> GetPermissionsAsync(int? year, int? month, int? departmentId);
    Task<int> SavePermissionAsync(PermissionSaveRequest req);
    Task DeletePermissionAsync(int id);
}

public class AttendanceRepository : IAttendanceRepository
{
    private readonly ISqlConnectionFactory _factory;
    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public AttendanceRepository(ISqlConnectionFactory factory) => _factory = factory;

    public async Task<AttendanceSheetResponse> GetSheetAsync(int year, int month, int? departmentId)
    {
        using var db = _factory.Create();
        using var grid = await db.QueryMultipleAsync(
            "SP_Attendance_GetSheet",
            new { Year = year, Month = month, DepartmentId = departmentId },
            commandType: CommandType.StoredProcedure);

        var employees = (await grid.ReadAsync<AttendanceEmployeeDto>()).ToList();
        var entries = (await grid.ReadAsync<AttendanceEntryDto>()).ToList();
        var holidays = (await grid.ReadAsync<int>()).ToList();

        return new AttendanceSheetResponse
        {
            Year = year,
            Month = month,
            Employees = employees,
            Entries = entries,
            Holidays = holidays,
        };
    }

    public async Task SaveSheetAsync(SaveSheetRequest req)
    {
        var json = JsonSerializer.Serialize(req.Entries, JsonOpts);
        using var db = _factory.Create();
        await db.ExecuteAsync(
            "SP_Attendance_SaveSheet",
            new { req.Year, req.Month, EntriesJson = json },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CopyPreviousMonthAsync(int year, int month, int? departmentId)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>(
            "SP_Attendance_CopyPreviousMonth",
            new { Year = year, Month = month, DepartmentId = departmentId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<BalanceCfDto>> GetBalanceCfAsync(int year, int month)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<BalanceCfDto>(
            "SP_BalanceCF_GetByMonth",
            new { Year = year, Month = month },
            commandType: CommandType.StoredProcedure);
    }

    public async Task SaveBalanceCfAsync(BalanceCfSaveRequest req)
    {
        var json = JsonSerializer.Serialize(req.Items, JsonOpts);
        using var db = _factory.Create();
        await db.ExecuteAsync(
            "SP_BalanceCF_Save",
            new { req.Year, req.Month, ItemsJson = json },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<OnsiteEntryDto>> GetOnsiteAsync(string? from, string? to, int? departmentId)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<OnsiteEntryDto>(
            "SP_Onsite_GetAll",
            new { From = from, To = to, DepartmentId = departmentId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<PermissionDto>> GetPermissionsAsync(int? year, int? month, int? departmentId)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<PermissionDto>(
            "SP_Permission_GetAll",
            new { Year = year, Month = month, DepartmentId = departmentId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> SavePermissionAsync(PermissionSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>(
            "SP_Permission_Save",
            new { req.PermissionId, req.EmployeeId, req.PermDate, req.FromTime, req.ToTime, req.Reason, req.Remarks },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeletePermissionAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Permission_Delete", new { PermissionId = id }, commandType: CommandType.StoredProcedure);
    }
}
