using System.Data;
using System.Text.Json;
using Attendance.Api.Data;
using Attendance.Api.Models.Implementation;
using Dapper;

namespace Attendance.Api.Repositories;

public interface IImplementationRepository
{
    Task<IEnumerable<ImplementationSummaryDto>> GetAllAsync();
    Task<ImplementationDetailDto?> GetByIdAsync(int id);
    Task<int> SaveAsync(ImplementationSaveRequest req);
    Task DeleteAsync(int id);
}

public class ImplementationRepository : IImplementationRepository
{
    private readonly ISqlConnectionFactory _factory;
    public ImplementationRepository(ISqlConnectionFactory factory) => _factory = factory;

    private const CommandType SP = CommandType.StoredProcedure;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<IEnumerable<ImplementationSummaryDto>> GetAllAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ImplementationSummaryDto>("SP_Implementation_GetAll", commandType: SP);
    }

    public async Task<ImplementationDetailDto?> GetByIdAsync(int id)
    {
        using var db = _factory.Create();
        var row = await db.QuerySingleOrDefaultAsync("SP_Implementation_GetById", new { ImplId = id }, commandType: SP);
        if (row is null) return null;

        var tasks = new List<ImplementationTaskDto>();
        string? tasksJson = row.TasksJson as string;
        if (!string.IsNullOrWhiteSpace(tasksJson))
        {
            try { tasks = JsonSerializer.Deserialize<List<ImplementationTaskDto>>(tasksJson, JsonOpts) ?? new(); }
            catch { tasks = new(); }
        }

        string? addonsCsv = row.Addons as string;
        var addons = string.IsNullOrWhiteSpace(addonsCsv)
            ? new List<string>()
            : addonsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

        var docs = new List<ImplementationDocDto>();
        string? docsJson = row.DocsJson as string;
        if (!string.IsNullOrWhiteSpace(docsJson))
        {
            try { docs = JsonSerializer.Deserialize<List<ImplementationDocDto>>(docsJson, JsonOpts) ?? new(); }
            catch { docs = new(); }
        }

        var testing = new List<ImplementationTestDto>();
        string? testingJson = row.TestingJson as string;
        if (!string.IsNullOrWhiteSpace(testingJson))
        {
            try { testing = JsonSerializer.Deserialize<List<ImplementationTestDto>>(testingJson, JsonOpts) ?? new(); }
            catch { testing = new(); }
        }

        return new ImplementationDetailDto
        {
            ImplId = (int)row.ImplId,
            ClientName = (string)row.ClientName,
            Address = row.Address as string,
            Phone = row.Phone as string,
            ResponsiblePerson = row.ResponsiblePerson as string,
            LocationType = (string)row.LocationType,
            Addons = addons,
            Tasks = tasks,
            Docs = docs,
            Testing = testing,
            CompletionPercent = (int)row.CompletionPercent,
        };
    }

    public async Task<int> SaveAsync(ImplementationSaveRequest req)
    {
        using var db = _factory.Create();
        var tasksJson = JsonSerializer.Serialize(req.Tasks ?? new(), JsonOpts);
        var docsJson = (req.Docs != null && req.Docs.Count > 0) ? JsonSerializer.Serialize(req.Docs, JsonOpts) : null;
        var testingJson = (req.Testing != null && req.Testing.Count > 0) ? JsonSerializer.Serialize(req.Testing, JsonOpts) : null;
        var addonsCsv = string.Join(",", req.Addons ?? new());
        return await db.QuerySingleAsync<int>("SP_Implementation_Save", new
        {
            req.ImplId,
            req.ClientName,
            req.Address,
            req.Phone,
            req.ResponsiblePerson,
            req.LocationType,
            Addons = addonsCsv,
            TasksJson = tasksJson,
            DocsJson = docsJson,
            TestingJson = testingJson,
            req.CompletionPercent,
        }, commandType: SP);
    }

    public async Task DeleteAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Implementation_Delete", new { ImplId = id }, commandType: SP);
    }
}
