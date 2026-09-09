using Attendance.Api.Authorization;
using Attendance.Api.Models.Implementation;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

// New Client Implementation records: summary list + click-to-open detail + save/delete.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImplementationController : ControllerBase
{
    private readonly IImplementationRepository _repo;
    public ImplementationController(IImplementationRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _repo.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var rec = await _repo.GetByIdAsync(id);
        return rec is null ? NotFound() : Ok(rec);
    }

    [HttpPost]
    [RequireRight("implementation", "write")]
    public async Task<IActionResult> Save([FromBody] ImplementationSaveRequest req)
        => Ok(new { implId = await _repo.SaveAsync(req) });

    [HttpDelete("{id:int}")]
    [RequireRight("implementation", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        await _repo.DeleteAsync(id);
        return Ok(new { message = "Implementation deleted." });
    }
}
