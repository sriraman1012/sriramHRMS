using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardRepository _repo;
    public DashboardController(IDashboardRepository repo) => _repo = repo;

    /// <summary>Home dashboard: today's counts + employee-wise monthly summary (filterable).</summary>
    [HttpGet("home")]
    public async Task<IActionResult> Home(
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] int? departmentId,
        [FromQuery] DateTime? today)
    {
        var t = today ?? DateTime.Today;
        var y = year ?? t.Year;
        var m = (month is >= 1 and <= 12) ? month.Value : t.Month;
        return Ok(await _repo.GetHomeAsync(y, m, departmentId, t));
    }

    /// <summary>Present vs Absent trend for the dashboard line chart: mode = date | month | year.</summary>
    [HttpGet("trend")]
    public async Task<IActionResult> Trend(
        [FromQuery] string? mode,
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] int? departmentId,
        [FromQuery] string? from,
        [FromQuery] string? to)
    {
        var md = mode is "month" or "year" ? mode : "date";
        return Ok(await _repo.GetAttendanceTrendAsync(md, year, month, departmentId,
            string.IsNullOrWhiteSpace(from) ? null : from,
            string.IsNullOrWhiteSpace(to) ? null : to));
    }
}
