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
public class HolidayController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public HolidayController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetHolidaysAsync());

    [HttpPost]
    [RequireRight("holiday", "write")]
    public async Task<IActionResult> Save([FromBody] HolidaySaveRequest req)
    {
        try { return Ok(new { holidayId = await _repo.SaveHolidayAsync(req) }); }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        { return Conflict(new { message = "A holiday already exists on that date." }); }
    }

    [HttpDelete("{id:int}")]
    [RequireRight("holiday", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteHolidayAsync(id);
        return Ok(new { message = "Holiday deleted." });
    }
}
