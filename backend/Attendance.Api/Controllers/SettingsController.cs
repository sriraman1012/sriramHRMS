using Attendance.Api.Authorization;
using Attendance.Api.Models.Settings;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ISettingsRepository _repo;
    public SettingsController(ISettingsRepository repo) => _repo = repo;

    /// <summary>Get the weekly-off rules (every-week days + nth-weekday offs).</summary>
    [HttpGet("weekly-off")]
    public async Task<IActionResult> GetWeeklyOff() => Ok(await _repo.GetWeeklyOffAsync());

    /// <summary>Save the weekly-off rules.</summary>
    [HttpPost("weekly-off")]
    [RequireRight("weekly-off", "write")]
    public async Task<IActionResult> SaveWeeklyOff([FromBody] WeeklyOffRequest req)
    {
        await _repo.SaveWeeklyOffAsync(req.Days ?? new List<int>(), req.Nth);
        return Ok(new { message = "Weekly off days saved." });
    }

    /// <summary>Get the manual working-days override for a month (null if not set).</summary>
    [HttpGet("working-days")]
    public async Task<IActionResult> GetWorkingDays([FromQuery] int year, [FromQuery] int month)
        => Ok(new { year, month, workingDays = await _repo.GetWorkingDaysAsync(year, month) });

    /// <summary>Set the manual working-days for a month.</summary>
    [HttpPost("working-days")]
    [RequireRight("att-entry", "write")]
    public async Task<IActionResult> SaveWorkingDays([FromBody] WorkingDaysRequest req)
    {
        await _repo.SaveWorkingDaysAsync(req.Year, req.Month, req.WorkingDays);
        return Ok(new { message = "Working days saved." });
    }
}
