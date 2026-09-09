namespace Attendance.Api.Models.Attendance;

public class AttendanceEmployeeDto
{
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class AttendanceEntryDto
{
    public int EmployeeId { get; set; }
    public int Day { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public string? Note { get; set; }   // PO (Present Onsite) customer / location
}

public class AttendanceSheetResponse
{
    public int Year { get; set; }
    public int Month { get; set; }
    public List<AttendanceEmployeeDto> Employees { get; set; } = new();
    public List<AttendanceEntryDto> Entries { get; set; } = new();
    public List<int> Holidays { get; set; } = new();
}

public class SaveEntryDto
{
    public int EmployeeId { get; set; }
    public int Day { get; set; }
    public string? StatusCode { get; set; }   // blank/null = clear that cell
    public string? Note { get; set; }         // PO (Present Onsite) customer / location
}

public class SaveSheetRequest
{
    public int Year { get; set; }
    public int Month { get; set; }
    public List<SaveEntryDto> Entries { get; set; } = new();
}

public class CopyPreviousRequest
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int? DepartmentId { get; set; }
}

// ---- Balance Carry Forward ----
public class BalanceCfDto
{
    public int EmployeeId { get; set; }
    public decimal CarryForward { get; set; }
    public decimal Deducted { get; set; }
    public string? Remarks { get; set; }
}

public class BalanceCfSaveRequest
{
    public int Year { get; set; }
    public int Month { get; set; }
    public List<BalanceCfDto> Items { get; set; } = new();
}

// ---- Onsite (PO) report ----
public class OnsiteEntryDto
{
    public int AttendanceId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public DateTime OnsiteDate { get; set; }
    public string? Place { get; set; }
}

// ---- Hourly Permission ----
public class PermissionDto
{
    public int PermissionId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public DateTime PermDate { get; set; }
    public TimeSpan FromTime { get; set; }
    public TimeSpan ToTime { get; set; }
    public decimal Hours { get; set; }
    public string? Reason { get; set; }
    public string? Remarks { get; set; }
}

public class PermissionSaveRequest
{
    public int? PermissionId { get; set; }
    public int EmployeeId { get; set; }
    public string PermDate { get; set; } = string.Empty;   // yyyy-MM-dd
    public string FromTime { get; set; } = string.Empty;   // HH:mm
    public string ToTime { get; set; } = string.Empty;     // HH:mm
    public string? Reason { get; set; }
    public string? Remarks { get; set; }
}
