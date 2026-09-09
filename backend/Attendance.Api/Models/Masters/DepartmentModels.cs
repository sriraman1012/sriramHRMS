using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class DepartmentDto
{
    public int DepartmentId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string? Head { get; set; }
    public bool IsActive { get; set; }
}

public class DepartmentSaveRequest
{
    public int? DepartmentId { get; set; }
    [Required] public string DepartmentCode { get; set; } = string.Empty;
    [Required] public string DepartmentName { get; set; } = string.Empty;
    public string? Head { get; set; }
    public bool IsActive { get; set; } = true;
}
