using System.Data;
using Attendance.Api.Data;
using Attendance.Api.Models.TravelAdvance;
using Dapper;

namespace Attendance.Api.Repositories;

public interface ITravelAdvanceRepository
{
    Task<IEnumerable<TravelAdvanceDto>> GetAllAsync(DateTime? from, DateTime? to, int? departmentId, string? status);
    Task<TravelAdvanceDto?> GetByIdAsync(int id);
    Task<int> SaveAsync(TravelAdvanceSaveRequest req);
    Task SetStatusAsync(int id, string status, string approvedBy);
    Task DeleteAsync(int id);
}

public class TravelAdvanceRepository : ITravelAdvanceRepository
{
    private readonly ISqlConnectionFactory _factory;
    private const CommandType SP = CommandType.StoredProcedure;
    public TravelAdvanceRepository(ISqlConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<TravelAdvanceDto>> GetAllAsync(DateTime? from, DateTime? to, int? departmentId, string? status)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<TravelAdvanceDto>(
            "SP_TravelAdvance_GetAll",
            new { From = from, To = to, DepartmentId = departmentId, Status = status },
            commandType: SP);
    }

    public async Task<TravelAdvanceDto?> GetByIdAsync(int id)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<TravelAdvanceDto>(
            "SP_TravelAdvance_GetById", new { TravelId = id }, commandType: SP);
    }

    public async Task<int> SaveAsync(TravelAdvanceSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>(
            "SP_TravelAdvance_Save",
            new
            {
                req.TravelId,
                req.EmployeeId,
                req.ClientName,
                req.ClientLocation,
                req.TravelStartDate,
                req.TravelEndDate,
                req.OnsiteDays,
                req.AdvanceAmount,
                req.BusTicket,
                req.TrainTicket,
                req.FlightTicket,
                req.BikeExpense,
                req.Taxi,
                req.HotelBill,
                req.FoodBill,
                req.OtherExpense,
                req.Remarks,
                req.DocumentsJson,
            },
            commandType: SP);
    }

    public async Task SetStatusAsync(int id, string status, string approvedBy)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_TravelAdvance_SetStatus",
            new { TravelId = id, Status = status, ApprovedBy = approvedBy }, commandType: SP);
    }

    public async Task DeleteAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_TravelAdvance_Delete", new { TravelId = id }, commandType: SP);
    }
}
