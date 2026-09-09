using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class EmployeeListDto
{
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int? DesignationId { get; set; }
    public string? DesignationName { get; set; }
    public string? Shift { get; set; }
    public DateTime? JoiningDate { get; set; }
    public bool IsActive { get; set; }
}

public class EmployeeDetailDto
{
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public int? DepartmentId { get; set; }
    public int? DesignationId { get; set; }
    public string? Shift { get; set; }
    public DateTime? JoiningDate { get; set; }
    public bool IsActive { get; set; }
    // Personal
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MaritalStatus { get; set; }
    public string? BloodGroup { get; set; }
    public string? Nationality { get; set; }
    public string? Photo { get; set; }
    public string? PhotoName { get; set; }
    public string? Address { get; set; }
    // Emergency contact
    public string? EmergencyName { get; set; }
    public string? EmergencyNumber { get; set; }
    public string? EmergencyRelation { get; set; }
}

public class EmployeeSaveRequest
{
    public int? EmployeeId { get; set; }
    [Required] public string EmployeeCode { get; set; } = string.Empty;
    [Required] public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public int? DepartmentId { get; set; }
    public int? DesignationId { get; set; }
    public string? Shift { get; set; }
    public DateTime? JoiningDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MaritalStatus { get; set; }
    public string? BloodGroup { get; set; }
    public string? Nationality { get; set; }
    public string? Photo { get; set; }
    public string? PhotoName { get; set; }
    public string? Address { get; set; }
    public string? EmergencyName { get; set; }
    public string? EmergencyNumber { get; set; }
    public string? EmergencyRelation { get; set; }
}
