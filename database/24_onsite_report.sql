/* =====================================================================
   Unipro Attendance - Onsite (PO) Report
   Lists Present-Onsite entries with the customer/place, filterable by
   date range + department. Run against ATTANDANCE_IMP. Re-runnable.
   Requires 23_attendance_onsite.sql (adds tblAttendance.Note) first.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

CREATE OR ALTER PROCEDURE dbo.SP_Onsite_GetAll
    @From         DATE = NULL,
    @To           DATE = NULL,
    @DepartmentId INT  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT a.AttendanceId,
           e.EmployeeCode,
           EmployeeName   = e.Name,
           DepartmentName = d.DepartmentName,
           OnsiteDate     = a.AttDate,
           Place          = a.Note
    FROM dbo.tblAttendance a
    JOIN dbo.tblEmployee e   ON e.EmployeeId = a.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE a.StatusCode = 'PO'
      AND e.IsActive = 1
      AND (@From IS NULL OR a.AttDate >= @From)
      AND (@To   IS NULL OR a.AttDate <= @To)
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY a.AttDate DESC, e.Name;
END
GO
