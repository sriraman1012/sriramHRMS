/* =====================================================================
   Unipro Attendance - Attendance Entry - PROCEDURES  (SP_*)
   Run after 10_attendance_seed.sql. All CREATE OR ALTER (re-runnable).
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* Sheet for a month: employees (filtered), their entries, and holiday days. */
CREATE OR ALTER PROCEDURE dbo.SP_Attendance_GetSheet
    @Year         INT,
    @Month        INT,
    @DepartmentId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) Employees
    SELECT EmployeeId, EmployeeCode, Name
    FROM dbo.tblEmployee
    WHERE IsActive = 1
      AND (@DepartmentId IS NULL OR DepartmentId = @DepartmentId)
    ORDER BY EmployeeCode, Name;

    -- 2) Entries for the month
    SELECT a.EmployeeId, DAY(a.AttDate) AS [Day], a.StatusCode
    FROM dbo.tblAttendance a
    JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
    WHERE YEAR(a.AttDate) = @Year AND MONTH(a.AttDate) = @Month
      AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId);

    -- 3) Holiday days in the month
    SELECT DAY(HolidayDate) AS [Day]
    FROM dbo.tblHoliday
    WHERE YEAR(HolidayDate) = @Year AND MONTH(HolidayDate) = @Month;
END
GO

/* Save the whole sheet. @EntriesJson: [{ "employeeId":1, "day":5, "statusCode":"P" }, ...]
   Blank/empty statusCode deletes that cell. */
CREATE OR ALTER PROCEDURE dbo.SP_Attendance_SaveSheet
    @Year        INT,
    @Month       INT,
    @EntriesJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    ;MERGE dbo.tblAttendance AS t
    USING (
        SELECT s.EmployeeId,
               DATEFROMPARTS(@Year, @Month, s.[Day]) AS AttDate,
               NULLIF(LTRIM(RTRIM(s.StatusCode)), N'') AS StatusCode
        FROM OPENJSON(@EntriesJson)
        WITH (
            EmployeeId INT         '$.employeeId',
            [Day]      INT         '$.day',
            StatusCode NVARCHAR(5) '$.statusCode'
        ) AS s
    ) AS src
    ON t.EmployeeId = src.EmployeeId AND t.AttDate = src.AttDate
    WHEN MATCHED AND src.StatusCode IS NULL THEN DELETE
    WHEN MATCHED THEN
        UPDATE SET StatusCode = src.StatusCode, UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED BY TARGET AND src.StatusCode IS NOT NULL THEN
        INSERT (EmployeeId, AttDate, StatusCode, CreatedAt)
        VALUES (src.EmployeeId, src.AttDate, src.StatusCode, SYSUTCDATETIME());
END
GO

/* Copy previous month's entries into the selected month (same day-of-month). */
CREATE OR ALTER PROCEDURE dbo.SP_Attendance_CopyPreviousMonth
    @Year         INT,
    @Month        INT,
    @DepartmentId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @pm INT = @Month - 1, @py INT = @Year;
    IF @pm = 0 BEGIN SET @pm = 12; SET @py = @Year - 1; END

    DECLARE @daysInTarget INT = DAY(EOMONTH(DATEFROMPARTS(@Year, @Month, 1)));

    ;MERGE dbo.tblAttendance AS t
    USING (
        SELECT a.EmployeeId,
               DATEFROMPARTS(@Year, @Month, DAY(a.AttDate)) AS AttDate,
               a.StatusCode
        FROM dbo.tblAttendance a
        JOIN dbo.tblEmployee e
            ON e.EmployeeId = a.EmployeeId
           AND e.IsActive = 1
           AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
        WHERE YEAR(a.AttDate) = @py AND MONTH(a.AttDate) = @pm
          AND DAY(a.AttDate) <= @daysInTarget
    ) AS src
    ON t.EmployeeId = src.EmployeeId AND t.AttDate = src.AttDate
    WHEN MATCHED THEN
        UPDATE SET StatusCode = src.StatusCode, UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (EmployeeId, AttDate, StatusCode, CreatedAt)
        VALUES (src.EmployeeId, src.AttDate, src.StatusCode, SYSUTCDATETIME());

    SELECT @@ROWCOUNT AS RowsCopied;
END
GO
