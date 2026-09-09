using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Auth;

public class ChangePasswordRequest
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string OldPassword { get; set; } = string.Empty;
    [Required] public string NewPassword { get; set; } = string.Empty;
}
