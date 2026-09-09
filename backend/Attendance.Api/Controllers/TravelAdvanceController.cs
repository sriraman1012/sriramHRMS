using Attendance.Api.Authorization;
using Attendance.Api.Models.TravelAdvance;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TravelAdvanceController : ControllerBase
{
    private readonly ITravelAdvanceRepository _repo;
    public TravelAdvanceController(ITravelAdvanceRepository repo) => _repo = repo;

    /// <summary>List travel advances (optional date range, department, status filters).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? from, [FromQuery] string? to,
        [FromQuery] int? departmentId, [FromQuery] string? status)
    {
        DateTime? f = DateTime.TryParse(from, out var fd) ? fd : null;
        DateTime? t = DateTime.TryParse(to, out var td) ? td : null;
        var s = string.IsNullOrWhiteSpace(status) ? null : status;
        return Ok(await _repo.GetAllAsync(f, t, departmentId, s));
    }

    /// <summary>One travel advance incl. its supporting documents.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var row = await _repo.GetByIdAsync(id);
        return row is null ? NotFound() : Ok(row);
    }

    /// <summary>Create or update a travel advance (Total & Balance auto-computed).</summary>
    [HttpPost]
    [RequireRight("travel-advance", "write")]
    public async Task<IActionResult> Save([FromBody] TravelAdvanceSaveRequest req)
    {
        if (req.EmployeeId <= 0) return BadRequest(new { message = "Employee is required." });
        if (req.TravelEndDate < req.TravelStartDate) return BadRequest(new { message = "End date cannot be before start date." });
        var id = await _repo.SaveAsync(req);
        return Ok(new { travelId = id, message = "Travel advance saved." });
    }

    /// <summary>Approve / Reject / re-open a travel settlement.</summary>
    [HttpPost("{id:int}/status")]
    [RequireRight("travel-advance", "edit")]
    public async Task<IActionResult> SetStatus(int id, [FromBody] TravelStatusRequest req)
    {
        await _repo.SetStatusAsync(id, req.Status, User.Identity?.Name ?? "admin");
        return Ok(new { message = $"Marked {req.Status}." });
    }

    /// <summary>Delete a travel advance.</summary>
    [HttpDelete("{id:int}")]
    [RequireRight("travel-advance", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return Ok(new { message = "Travel advance deleted." });
    }
}
