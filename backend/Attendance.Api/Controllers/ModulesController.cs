using Attendance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly IUserManagementService _svc;

    public ModulesController(IUserManagementService svc) => _svc = svc;

    /// <summary>All active modules (for the rights grid).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetModulesAsync());
}
