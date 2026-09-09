namespace Attendance.Api.Models.Entities;

/// <summary>Maps to a row in dbo.Users.</summary>
public class User
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Role { get; set; } = "admin";
    public bool IsActive { get; set; }
    public string? GroupName { get; set; }   // from SP_User_GetByUsername join
}
