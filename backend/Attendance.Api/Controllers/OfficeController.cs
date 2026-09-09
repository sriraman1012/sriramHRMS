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
public class OfficeController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public OfficeController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetOfficesAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var o = await _repo.GetOfficeByIdAsync(id);
        return o is null ? NotFound() : Ok(o);
    }

    [HttpPost]
    [RequireRight("office", "write")]
    public async Task<IActionResult> Save([FromBody] OfficeSaveRequest req)
    {
        try { return Ok(new { officeId = await _repo.SaveOfficeAsync(req) }); }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        { return Conflict(new { message = "That Office Code already exists." }); }
    }

    [HttpPatch("{id:int}/active")]
    [RequireRight("office", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetOfficeActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("office", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _repo.DeleteOfficeAsync(id); return Ok(new { message = "Office deleted." }); }
        catch (SqlException ex) when (ex.Number == 50000) { return Conflict(new { message = ex.Message }); }
    }
}
