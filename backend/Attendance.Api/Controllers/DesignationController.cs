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
public class DesignationController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public DesignationController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetDesignationsAsync());

    [HttpPost]
    [RequireRight("designation", "write")]
    public async Task<IActionResult> Save([FromBody] DesignationSaveRequest req)
    {
        try { return Ok(new { designationId = await _repo.SaveDesignationAsync(req) }); }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        { return Conflict(new { message = "That Designation Code already exists." }); }
    }

    [HttpPatch("{id:int}/active")]
    [RequireRight("designation", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetDesignationActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("designation", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _repo.DeleteDesignationAsync(id); return Ok(new { message = "Designation deleted." }); }
        catch (SqlException ex) when (ex.Number == 50000) { return Conflict(new { message = ex.Message }); }
    }
}
