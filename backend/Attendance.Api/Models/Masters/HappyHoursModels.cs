using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class HappyHourDto
{
    public int HappyHourId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? DayName { get; set; }
    public DateTime? EventDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? LocationAddress { get; set; }
    public bool IsActive { get; set; }
}

public class HappyHourSaveRequest
{
    public int? HappyHourId { get; set; }
    [Required] public string Title { get; set; } = string.Empty;
    public string? DayName { get; set; }
    public string? EventDate { get; set; }   // yyyy-MM-dd
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? LocationAddress { get; set; }
    public bool IsActive { get; set; } = true;
}
