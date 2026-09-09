using Attendance.Api.Authorization;
using Attendance.Api.Models.Leave;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly ILeaveRepository _repo;
    public LeaveController(ILeaveRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var l = await _repo.GetByIdAsync(id);
        return l is null ? NotFound() : Ok(l);
    }

    /// <summary>Register or update a leave (also marks attendance as Leave for the range).</summary>
    [HttpPost]
    [RequireRight("leave-register", "write")]
    public async Task<IActionResult> Save([FromBody] LeaveSaveRequest req)
    {
        if (req.ToDate < req.FromDate)
            return BadRequest(new { message = "To Date cannot be before From Date." });
        var leaveId = await _repo.SaveAsync(req);
        return Ok(new { leaveId, message = "Leave registered and attendance marked as Leave." });
    }

    /// <summary>Delete a leave (also clears the Leave marks it created).</summary>
    [HttpDelete("{id:int}")]
    [RequireRight("leave-register", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return Ok(new { message = "Leave deleted." });
    }
}
