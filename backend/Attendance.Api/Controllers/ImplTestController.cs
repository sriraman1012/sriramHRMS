using Attendance.Api.Authorization;
using Attendance.Api.Models.Masters;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

// Process Testing master: the Backoffice / POS test items used by New Client Implementation.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImplTestController : ControllerBase
{
    private readonly IMastersRepository _repo;
    public ImplTestController(IMastersRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetImplTestsAsync());

    [HttpPost]
    [RequireRight("impl-master", "write")]
    public async Task<IActionResult> Save([FromBody] ImplTestItemSaveRequest req)
        => Ok(new { testId = await _repo.SaveImplTestAsync(req) });

    [HttpPatch("{id:int}/active")]
    [RequireRight("impl-master", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] ActiveRequest req)
    {
        await _repo.SetImplTestActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    [HttpDelete("{id:int}")]
    [RequireRight("impl-master", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteImplTestAsync(id);
        return Ok(new { message = "Test item deleted." });
    }
}
