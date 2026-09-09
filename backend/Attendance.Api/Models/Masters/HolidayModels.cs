using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class HolidayDto
{
    public int HolidayId { get; set; }
    public DateTime HolidayDate { get; set; }
    public string HolidayName { get; set; } = string.Empty;
    public string? HolidayType { get; set; }
}

public class HolidaySaveRequest
{
    public int? HolidayId { get; set; }
    [Required] public DateTime HolidayDate { get; set; }
    [Required] public string HolidayName { get; set; } = string.Empty;
    public string? HolidayType { get; set; }
}
