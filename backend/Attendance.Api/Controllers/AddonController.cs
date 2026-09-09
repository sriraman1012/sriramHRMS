using Attendance.Api.Authorization;
using Attendance.Api.Models.Masters;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

// Add-ons master: the selectable add-ons used by New Client Implementation.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AddonController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public AddonController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetAddonsAsync());

    [HttpPost]
    [RequireRight("impl-master", "write")]
    public async Task<IActionResult> Save([FromBody] AddonSaveRequest req)
        => Ok(new { addonId = await _repo.SaveAddonAsync(req) });

    [HttpPatch("{id:int}/active")]
    [RequireRight("impl-master", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetAddonActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("impl-master", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAddonAsync(id);
        return Ok(new { message = "Add-on deleted." });
    }
}
