using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.UserManagement;

public class UserGroupDto
{
    public int GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class UserGroupSaveRequest
{
    public int? GroupId { get; set; }   // null / 0 = insert, else update
    [Required]
    public string GroupName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
