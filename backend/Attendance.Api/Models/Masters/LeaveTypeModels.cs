using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class LeaveTypeDto
{
    public int LeaveTypeId { get; set; }
    public string LeaveTypeCode { get; set; } = string.Empty;
    public string LeaveName { get; set; } = string.Empty;
    public decimal? MaxDays { get; set; }
    public bool IsPaid { get; set; }
    public bool IsActive { get; set; }
}

public class LeaveTypeSaveRequest
{
    public int? LeaveTypeId { get; set; }
    [Required] public string LeaveTypeCode { get; set; } = string.Empty;
    [Required] public string LeaveName { get; set; } = string.Empty;
    public decimal? MaxDays { get; set; }
    public bool IsPaid { get; set; } = true;
    public bool IsActive { get; set; } = true;
}
