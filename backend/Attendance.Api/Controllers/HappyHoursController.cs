using Attendance.Api.Authorization;
using Attendance.Api.Models.Masters;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HappyHoursController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public HappyHoursController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetHappyHoursAsync());

    [HttpPost]
    [RequireRight("happy-hours", "write")]
    public async Task<IActionResult> Save([FromBody] HappyHourSaveRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Title is required." });
        return Ok(new { happyHourId = await _repo.SaveHappyHourAsync(req) });
    }

    [HttpPatch("{id:int}/active")]
    [RequireRight("happy-hours", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetHappyHourActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("happy-hours", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteHappyHourAsync(id);
        return Ok(new { message = "Happy hour deleted." });
    }
}
