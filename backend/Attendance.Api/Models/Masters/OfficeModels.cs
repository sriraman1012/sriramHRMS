using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class OfficeListDto
{
    public int OfficeId { get; set; }
    public string OfficeCode { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsActive { get; set; }
    public bool HasPhoto { get; set; }
}

public class OfficeDetailDto
{
    public int OfficeId { get; set; }
    public string OfficeCode { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PhotoBase64 { get; set; }
    public string? PhotoName { get; set; }
    public bool IsActive { get; set; }
}

public class OfficeSaveRequest
{
    public int? OfficeId { get; set; }
    [Required] public string OfficeCode { get; set; } = string.Empty;
    [Required] public string LocationName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PhotoBase64 { get; set; }
    public string? PhotoName { get; set; }
    public bool IsActive { get; set; } = true;
}

// Shared toggle-active request for master controllers.
public class ActiveRequest
{
    public bool IsActive { get; set; }
}
