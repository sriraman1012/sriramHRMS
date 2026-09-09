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
public class UsersController : ControllerBase
{
    private readonly IUserManagementService _svc;

    public UsersController(IUserManagementService svc) => _svc = svc;

    /// <summary>All users with their group name.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetUsersAsync());

    /// <summary>One user's full details (for editing).</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _svc.GetUserByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>Create a user (UserCode is auto-generated, e.g. UNI0001).</summary>
    [HttpPost]
    [RequireRight("users", "add")]
    public async Task<IActionResult> Add([FromBody] UserCreateRequest req)
    {
        try
        {
            var result = await _svc.AddUserAsync(req);
            return Ok(result);
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            return Conflict(new { message = "That username already exists." });
        }
    }

    /// <summary>Update a user. Leave password blank to keep the current one.</summary>
    [HttpPut("{id:int}")]
    [RequireRight("users", "edit")]
    public async Task<IActionResult> Update(int id, [FromBody] UserUpdateRequest req)
    {
        try
        {
            await _svc.UpdateUserAsync(id, req);
            return Ok(new { message = "User updated." });
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            return Conflict(new { message = "That username already exists." });
        }
    }

    /// <summary>Activate / deactivate a user.</summary>
    [HttpPatch("{id:int}/active")]
    [RequireRight("users", "edit")]
    public async Task<IActionResult> SetActive(int id, [FromBody] SetActiveRequest req)
    {
        await _svc.SetUserActiveAsync(id, req.IsActive);
        return Ok(new { message = "Status updated." });
    }

    /// <summary>Delete a user. You cannot delete the account you are logged in as.</summary>
    [HttpDelete("{id:int}")]
    [RequireRight("users", "delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var meRaw = User.FindFirst("sub")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(meRaw, out var meId) && meId == id)
            return Conflict(new { message = "You cannot delete the account you are logged in with." });

        try { await _svc.DeleteUserAsync(id); return Ok(new { message = "User deleted." }); }
        catch (SqlException ex) when (ex.Number == 50000) { return Conflict(new { message = ex.Message }); }
    }
}
