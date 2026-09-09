using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class AddonDto
{
    public int AddonId { get; set; }
    public string AddonName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class AddonSaveRequest
{
    public int? AddonId { get; set; }
    [Required] public string AddonName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
