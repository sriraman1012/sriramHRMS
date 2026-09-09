using System.Text.Json;
using Attendance.Api.Models.UserManagement;
using Attendance.Api.Repositories;

namespace Attendance.Api.Services;

public interface IUserManagementService
{
    Task<IEnumerable<ModuleDto>> GetModulesAsync();

    Task<IEnumerable<UserGroupDto>> GetGroupsAsync();
    Task<int> SaveGroupAsync(UserGroupSaveRequest req);
    Task DeleteGroupAsync(int groupId);

    Task<IEnumerable<ModuleRightDto>> GetRightsByGroupAsync(int groupId);
    Task SaveRightsAsync(RightsSaveRequest req);

    Task<IEnumerable<UserListItemDto>> GetUsersAsync();
    Task<UserDetailDto?> GetUserByIdAsync(int userId);
    Task<AddUserResult> AddUserAsync(UserCreateRequest req);
    Task UpdateUserAsync(int userId, UserUpdateRequest req);
    Task SetUserActiveAsync(int userId, bool isActive);
    Task DeleteUserAsync(int userId);
}

public class UserManagementService : IUserManagementService
{
    private readonly IRbacRepository _repo;
    private readonly IPasswordHasher _hasher;

    // Produces camelCase JSON keys (moduleId, canView, ...) expected by SP_UserGroupRights_Save.
    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public UserManagementService(IRbacRepository repo, IPasswordHasher hasher)
    {
        _repo = repo;
        _hasher = hasher;
    }

    public Task<IEnumerable<ModuleDto>> GetModulesAsync() => _repo.GetModulesAsync();

    public Task<IEnumerable<UserGroupDto>> GetGroupsAsync() => _repo.GetGroupsAsync();
    public Task<int> SaveGroupAsync(UserGroupSaveRequest req) => _repo.SaveGroupAsync(req);
    public Task DeleteGroupAsync(int groupId) => _repo.DeleteGroupAsync(groupId);

    public Task<IEnumerable<ModuleRightDto>> GetRightsByGroupAsync(int groupId) =>
        _repo.GetRightsByGroupAsync(groupId);

    public Task SaveRightsAsync(RightsSaveRequest req)
    {
        var json = JsonSerializer.Serialize(req.Rights, JsonOpts);
        return _repo.SaveRightsAsync(req.GroupId, json);
    }

    public Task<IEnumerable<UserListItemDto>> GetUsersAsync() => _repo.GetUsersAsync();
    public Task<UserDetailDto?> GetUserByIdAsync(int userId) => _repo.GetUserByIdAsync(userId);

    public Task<AddUserResult> AddUserAsync(UserCreateRequest req)
    {
        var hash = _hasher.Hash(req.Password);
        return _repo.AddUserAsync(req, hash);
    }

    public Task UpdateUserAsync(int userId, UserUpdateRequest req)
    {
        // Only re-hash when a new password is supplied; blank keeps the old one.
        string? hash = string.IsNullOrEmpty(req.Password) ? null : _hasher.Hash(req.Password);
        return _repo.UpdateUserAsync(userId, req, hash);
    }

    public Task SetUserActiveAsync(int userId, bool isActive) => _repo.SetUserActiveAsync(userId, isActive);
    public Task DeleteUserAsync(int userId) => _repo.DeleteUserAsync(userId);
}
