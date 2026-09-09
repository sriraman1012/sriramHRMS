namespace Attendance.Api.Models.Dashboard;

public class TrendPointDto
{
    public int Bucket { get; set; }
    public string BucketLabel { get; set; } = string.Empty;
    public int Present { get; set; }
    public int Absent { get; set; }
}

public class HomeSummaryDto
{
    public DateTime RefDate { get; set; }
    public int PresentToday { get; set; }
    public int AbsentLeaveToday { get; set; }
    public int TotalEmployees { get; set; }
    public int WorkingDays { get; set; }
    public int PermissionToday { get; set; }
    public int OnsiteToday { get; set; }
}

public class OnsiteDto
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public string? Place { get; set; }   // onsite customer / location
}

public class PermissionTodayDto
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public TimeSpan FromTime { get; set; }
    public TimeSpan ToTime { get; set; }
    public decimal Hours { get; set; }
    public string? Reason { get; set; }
}

public class EmployeeSummaryDto
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal LeaveDays { get; set; }
    public decimal SickLeave { get; set; }
    public int WorkingDays { get; set; }
    public int HolidaysWorking { get; set; }
    // Total and ExtraWorkingDays are computed on the client from the above.
}

public class DeptPresentDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int EmployeeCount { get; set; }
    public int PresentCount { get; set; }
    public int LeaveCount { get; set; }
    public int PermissionCount { get; set; }
}

public class AbsentLeaveDto
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public string StatusCode { get; set; } = string.Empty;
}

public class HomeDashboardResponse
{
    public int Year { get; set; }
    public int Month { get; set; }
    public HomeSummaryDto Summary { get; set; } = new();
    public List<EmployeeSummaryDto> EmployeeSummary { get; set; } = new();
    public List<DeptPresentDto> DepartmentPresent { get; set; } = new();
    public List<AbsentLeaveDto> AbsentLeave { get; set; } = new();
    public List<PermissionTodayDto> PermissionToday { get; set; } = new();
    public List<OnsiteDto> Onsite { get; set; } = new();
}
