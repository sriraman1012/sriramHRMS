using Attendance.Api.Authorization;
using Attendance.Api.Models.UserManagement;
using Attendance.Api.Repositories;
using Attendance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserRightsController : ControllerBase
{
    private readonly IUserManagementService _svc;
    private readonly IRbacRepository _rbac;

    public UserRightsController(IUserManagementService svc, IRbacRepository rbac)
    {
        _svc = svc;
        _rbac = rbac;
    }

    /// <summary>Effective rights of the logged-in user (module code -> flags). Admin => all.</summary>
    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();
        return Ok(await _rbac.GetRightsForUserAsync(username));
    }

    /// <summary>Rights grid for a group: every active module with its ticks (0 where unset).</summary>
    [HttpGet("{groupId:int}")]
    public async Task<IActionResult> GetByGroup(int groupId) =>
        Ok(await _svc.GetRightsByGroupAsync(groupId));

    /// <summary>Save the whole rights grid for a group.</summary>
    [HttpPost]
    [RequireRight("rights", "write")]
    public async Task<IActionResult> Save([FromBody] RightsSaveRequest req)
    {
        await _svc.SaveRightsAsync(req);
        return Ok(new { message = "Rights saved." });
    }
}
