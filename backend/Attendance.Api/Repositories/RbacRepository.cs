using System.Data;
using Attendance.Api.Data;
using Attendance.Api.Models.UserManagement;
using Dapper;

namespace Attendance.Api.Repositories;

public interface IRbacRepository
{
    Task<IEnumerable<ModuleDto>> GetModulesAsync();

    Task<IEnumerable<UserGroupDto>> GetGroupsAsync();
    Task<int> SaveGroupAsync(UserGroupSaveRequest req);
    Task DeleteGroupAsync(int groupId);

    Task<IEnumerable<ModuleRightDto>> GetRightsByGroupAsync(int groupId);
    Task SaveRightsAsync(int groupId, string rightsJson);
    Task<IEnumerable<UserRightDto>> GetRightsForUserAsync(string username);
    Task<bool> HasRightAsync(string username, string moduleCode, string action);

    Task<IEnumerable<UserListItemDto>> GetUsersAsync();
    Task<UserDetailDto?> GetUserByIdAsync(int userId);
    Task<AddUserResult> AddUserAsync(UserCreateRequest req, string passwordHash);
    Task UpdateUserAsync(int userId, UserUpdateRequest req, string? passwordHash);
    Task SetUserActiveAsync(int userId, bool isActive);
    Task DeleteUserAsync(int userId);
}

public class RbacRepository : IRbacRepository
{
    private readonly ISqlConnectionFactory _factory;

    public RbacRepository(ISqlConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<ModuleDto>> GetModulesAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ModuleDto>("SP_Module_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<UserGroupDto>> GetGroupsAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<UserGroupDto>("SP_UserGroup_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<int> SaveGroupAsync(UserGroupSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>(
            "SP_UserGroup_Save",
            new { req.GroupId, req.GroupName, req.Description, req.IsActive },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteGroupAsync(int groupId)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_UserGroup_Delete", new { GroupId = groupId }, commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<ModuleRightDto>> GetRightsByGroupAsync(int groupId)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ModuleRightDto>(
            "SP_UserGroupRights_GetByGroup",
            new { GroupId = groupId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task SaveRightsAsync(int groupId, string rightsJson)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync(
            "SP_UserGroupRights_Save",
            new { GroupId = groupId, RightsJson = rightsJson },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<UserRightDto>> GetRightsForUserAsync(string username)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<UserRightDto>(
            "SP_UserRights_GetForUser",
            new { Username = username },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> HasRightAsync(string username, string moduleCode, string action)
    {
        using var db = _factory.Create();
        var f = await db.QuerySingleOrDefaultAsync<RightFlags>(
            "SP_UserRights_Check",
            new { Username = username, ModuleCode = moduleCode },
            commandType: CommandType.StoredProcedure);
        if (f is null) return false;
        return action switch
        {
            "view"   => f.CanView,
            "add"    => f.CanAdd,
            "edit"   => f.CanEdit,
            "delete" => f.CanDelete,
            "export" => f.CanExport,
            "write"  => f.CanAdd || f.CanEdit,   // combined save (add-or-edit)
            _        => false,
        };
    }

    public async Task<IEnumerable<UserListItemDto>> GetUsersAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<UserListItemDto>("SP_User_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<UserDetailDto?> GetUserByIdAsync(int userId)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<UserDetailDto>(
            "SP_User_GetById",
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<AddUserResult> AddUserAsync(UserCreateRequest req, string passwordHash)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<AddUserResult>(
            "SP_User_Add",
            new
            {
                req.Username,
                PasswordHash = passwordHash,
                req.Email,
                req.Mobile,
                req.Address1,
                req.Address2,
                req.Designation,
                req.GroupId,
                req.IsActive
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateUserAsync(int userId, UserUpdateRequest req, string? passwordHash)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync(
            "SP_User_Update",
            new
            {
                UserId = userId,
                req.Username,
                req.Email,
                req.Mobile,
                req.Address1,
                req.Address2,
                req.Designation,
                req.GroupId,
                req.IsActive,
                PasswordHash = passwordHash
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task SetUserActiveAsync(int userId, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync(
            "SP_User_SetActive",
            new { UserId = userId, IsActive = isActive },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteUserAsync(int userId)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_User_Delete", new { UserId = userId }, commandType: CommandType.StoredProcedure);
    }
}
