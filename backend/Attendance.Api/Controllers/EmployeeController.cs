using Attendance.Api.Authorization;
using Attendance.Api.Models.Masters;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeeController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public EmployeeController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetEmployeesAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var e = await _repo.GetEmployeeByIdAsync(id);
        return e is null ? NotFound() : Ok(e);
    }

    [HttpPost]
    [RequireRight("employee", "write")]
    public async Task<IActionResult> Save([FromBody] EmployeeSaveRequest req)
    {
        try { return Ok(new { employeeId = await _repo.SaveEmployeeAsync(req) }); }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        { return Conflict(new { message = "That Employee Code already exists." }); }
    }

    [HttpPatch("{id:int}/active")]
    [RequireRight("employee", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetEmployeeActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("employee", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _repo.DeleteEmployeeAsync(id); return Ok(new { message = "Employee deleted." }); }
        catch (SqlException ex) when (ex.Number == 50000) { return Conflict(new { message = ex.Message }); }
    }
}
