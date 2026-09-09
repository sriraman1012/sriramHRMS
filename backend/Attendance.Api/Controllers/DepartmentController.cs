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
public class DepartmentController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public DepartmentController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetDepartmentsAsync());

    [HttpPost]
    [RequireRight("department", "write")]
    public async Task<IActionResult> Save([FromBody] DepartmentSaveRequest req)
    {
        try { return Ok(new { departmentId = await _repo.SaveDepartmentAsync(req) }); }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        { return Conflict(new { message = "That Department Code already exists." }); }
    }

    [HttpPatch("{id:int}/active")]
    [RequireRight("department", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetDepartmentActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("department", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _repo.DeleteDepartmentAsync(id); return Ok(new { message = "Department deleted." }); }
        catch (SqlException ex) when (ex.Number == 50000) { return Conflict(new { message = ex.Message }); }
    }
}
