using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class DesignationDto
{
    public int DesignationId { get; set; }
    public string DesignationCode { get; set; } = string.Empty;
    public string DesignationName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class DesignationSaveRequest
{
    public int? DesignationId { get; set; }
    [Required] public string DesignationCode { get; set; } = string.Empty;
    [Required] public string DesignationName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
