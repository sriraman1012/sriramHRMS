using System.Data;
using Attendance.Api.Data;
using Attendance.Api.Models.Leave;
using Dapper;

namespace Attendance.Api.Repositories;

public interface ILeaveRepository
{
    Task<IEnumerable<LeaveDto>> GetAllAsync();
    Task<LeaveDto?> GetByIdAsync(int id);
    Task<int> SaveAsync(LeaveSaveRequest req);
    Task DeleteAsync(int id);
}

public class LeaveRepository : ILeaveRepository
{
    private readonly ISqlConnectionFactory _factory;
    public LeaveRepository(ISqlConnectionFactory factory) => _factory = factory;

    private const CommandType SP = CommandType.StoredProcedure;

    public async Task<IEnumerable<LeaveDto>> GetAllAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<LeaveDto>("SP_Leave_GetAll", commandType: SP);
    }

    public async Task<LeaveDto?> GetByIdAsync(int id)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<LeaveDto>("SP_Leave_GetById", new { LeaveId = id }, commandType: SP);
    }

    public async Task<int> SaveAsync(LeaveSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>(
            "SP_Leave_Save",
            new
            {
                req.LeaveId,
                req.EmployeeId,
                req.LeaveTypeId,
                req.FromDate,
                req.ToDate,
                req.Reason,
                req.Remarks
            },
            commandType: SP);
    }

    public async Task DeleteAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Leave_Delete", new { LeaveId = id }, commandType: SP);
    }
}
