using Attendance.Api.Authorization;
using Attendance.Api.Models.Masters;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

// Implementation Checklist master: the editable list of installation tasks,
// each flagged for Single-Location and/or Multiple-Location implementations.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImplChecklistController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public ImplChecklistController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetImplChecklistAsync());

    [HttpPost]
    [RequireRight("impl-master", "write")]
    public async Task<IActionResult> Save([FromBody] ImplChecklistItemSaveRequest req)
        => Ok(new { itemId = await _repo.SaveImplChecklistAsync(req) });

    [HttpPatch("{id:int}/active")]
    [RequireRight("impl-master", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetImplChecklistActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("impl-master", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteImplChecklistAsync(id);
        return Ok(new { message = "Checklist item deleted." });
    }
}
