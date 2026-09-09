using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.UserManagement;

public class UserListItemDto
{
    public int UserId { get; set; }
    public string? UserCode { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string? Designation { get; set; }
    public bool IsActive { get; set; }
    public int? GroupId { get; set; }
    public string? GroupName { get; set; }
}

public class UserDetailDto : UserListItemDto
{
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
}

public class UserCreateRequest
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;   // any chars allowed
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public string? Designation { get; set; }
    [Required] public int GroupId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UserUpdateRequest
{
    [Required] public string Username { get; set; } = string.Empty;
    public string? Password { get; set; }   // optional: blank = keep existing
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public string? Designation { get; set; }
    [Required] public int GroupId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AddUserResult
{
    public int UserId { get; set; }
    public string UserCode { get; set; } = string.Empty;
}

public class SetActiveRequest
{
    public bool IsActive { get; set; }
}
