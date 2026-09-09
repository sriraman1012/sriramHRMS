using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Leave;

public class LeaveDto
{
    public int LeaveId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public int? LeaveTypeId { get; set; }
    public string? LeaveTypeName { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string? Reason { get; set; }
    public string? Remarks { get; set; }
}

public class LeaveSaveRequest
{
    public int? LeaveId { get; set; }
    [Required] public int EmployeeId { get; set; }
    public int? LeaveTypeId { get; set; }
    [Required] public DateTime FromDate { get; set; }
    [Required] public DateTime ToDate { get; set; }
    public string? Reason { get; set; }
    public string? Remarks { get; set; }
}
