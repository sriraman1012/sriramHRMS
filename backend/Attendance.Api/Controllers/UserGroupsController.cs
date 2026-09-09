using Attendance.Api.Authorization;
using Attendance.Api.Models.UserManagement;
using Attendance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserGroupsController : ControllerBase
{
    private readonly IUserManagementService _svc;

    public UserGroupsController(IUserManagementService svc) => _svc = svc;

    /// <summary>All user groups.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetGroupsAsync());

    /// <summary>Create (GroupId null/0) or update a user group.</summary>
    [HttpPost]
    [RequireRight("groups", "write")]
    public async Task<IActionResult> Save([FromBody] UserGroupSaveRequest req)
    {
        var groupId = await _svc.SaveGroupAsync(req);
        return Ok(new { groupId });
    }

    /// <summary>Delete a group — blocked (with a message) if any user is mapped to it.</summary>
    [HttpDelete("{id:int}")]
    [RequireRight("groups", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _svc.DeleteGroupAsync(id); return Ok(new { message = "Group deleted." }); }
        catch (SqlException ex) when (ex.Number == 50000) { return Conflict(new { message = ex.Message }); }
    }
}
