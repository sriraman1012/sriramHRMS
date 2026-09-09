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
public class LeaveTypeController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public LeaveTypeController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetLeaveTypesAsync());

    [HttpPost]
    [RequireRight("leavetype", "write")]
    public async Task<IActionResult> Save([FromBody] LeaveTypeSaveRequest req)
    {
        try { return Ok(new { leaveTypeId = await _repo.SaveLeaveTypeAsync(req) }); }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        { return Conflict(new { message = "That Leave Type Code already exists." }); }
    }

    [HttpPatch("{id:int}/active")]
    [RequireRight("leavetype", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetLeaveTypeActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("leavetype", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _repo.DeleteLeaveTypeAsync(id); return Ok(new { message = "Leave type deleted." }); }
        catch (SqlException ex) when (ex.Number == 50000) { return Conflict(new { message = ex.Message }); }
    }
}
