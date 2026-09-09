using Attendance.Api.Authorization;
using Attendance.Api.Models.Attendance;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceRepository _repo;

    public AttendanceController(IAttendanceRepository repo) => _repo = repo;

    /// <summary>Attendance sheet for a month (employees + entries + holiday days).</summary>
    [HttpGet("sheet")]
    public async Task<IActionResult> GetSheet([FromQuery] int year, [FromQuery] int month, [FromQuery] int? departmentId)
    {
        if (year < 2000 || month < 1 || month > 12)
            return BadRequest(new { message = "Provide a valid year and month (1-12)." });
        return Ok(await _repo.GetSheetAsync(year, month, departmentId));
    }

    /// <summary>Save the whole sheet (upsert; blank code clears the cell).</summary>
    [HttpPost("sheet")]
    [RequireRight("att-entry", "write")]
    public async Task<IActionResult> SaveSheet([FromBody] SaveSheetRequest req)
    {
        await _repo.SaveSheetAsync(req);
        return Ok(new { message = "Attendance saved." });
    }

    /// <summary>Copy the previous month's entries into this month.</summary>
    [HttpPost("copy-previous")]
    [RequireRight("att-entry", "write")]
    public async Task<IActionResult> CopyPrevious([FromBody] CopyPreviousRequest req)
    {
        var rows = await _repo.CopyPreviousMonthAsync(req.Year, req.Month, req.DepartmentId);
        return Ok(new { rowsCopied = rows, message = $"Copied {rows} entr{(rows == 1 ? "y" : "ies")} from the previous month." });
    }

    /// <summary>Saved balance carry-forward deductions/remarks for a month.</summary>
    [HttpGet("balance-cf")]
    public async Task<IActionResult> GetBalanceCf([FromQuery] int year, [FromQuery] int month)
        => Ok(await _repo.GetBalanceCfAsync(year, month));

    /// <summary>Upsert the manual balance carry-forward deductions/remarks for a month.</summary>
    [HttpPost("balance-cf")]
    [RequireRight("balance-cf", "write")]
    public async Task<IActionResult> SaveBalanceCf([FromBody] BalanceCfSaveRequest req)
    {
        await _repo.SaveBalanceCfAsync(req);
        return Ok(new { message = "Balance carry forward saved." });
    }

    /// <summary>Present-Onsite (PO) entries with place, filterable by date range + department.</summary>
    [HttpGet("onsite")]
    public async Task<IActionResult> GetOnsite([FromQuery] string? from, [FromQuery] string? to, [FromQuery] int? departmentId)
        => Ok(await _repo.GetOnsiteAsync(
            string.IsNullOrWhiteSpace(from) ? null : from,
            string.IsNullOrWhiteSpace(to) ? null : to,
            departmentId));

    /// <summary>Hourly permission entries (filterable by month/year/department).</summary>
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions([FromQuery] int? year, [FromQuery] int? month, [FromQuery] int? departmentId)
        => Ok(await _repo.GetPermissionsAsync(year, month, departmentId));

    /// <summary>Create or update an hourly permission.</summary>
    [HttpPost("permission")]
    [RequireRight("hourly-permission", "write")]
    public async Task<IActionResult> SavePermission([FromBody] PermissionSaveRequest req)
    {
        if (req.EmployeeId <= 0 || string.IsNullOrEmpty(req.PermDate) || string.IsNullOrEmpty(req.FromTime) || string.IsNullOrEmpty(req.ToTime))
            return BadRequest(new { message = "Employee, date, from and to time are required." });
        return Ok(new { permissionId = await _repo.SavePermissionAsync(req) });
    }

    /// <summary>Delete an hourly permission.</summary>
    [HttpDelete("permission/{id:int}")]
    [RequireRight("hourly-permission", "delete")]
    public async Task<IActionResult> DeletePermission(int id)
    {
        await _repo.DeletePermissionAsync(id);
        return Ok(new { message = "Permission deleted." });
    }
}
