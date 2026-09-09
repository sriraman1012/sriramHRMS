/* =====================================================================
   Unipro Attendance - Home Dashboard - PROCEDURE  (SP_*)
   Run AFTER 13_settings.sql. Re-runnable.
   Filters: Year, Month, Department. @Today drives today's counts.
   Weekly-off days come from tblAppSetting (0=Sun .. 6=Sat).
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

CREATE OR ALTER PROCEDURE dbo.SP_Dashboard_Home
    @Year         INT,
    @Month        INT,
    @DepartmentId INT  = NULL,
    @Today        DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Configured weekly-off weekdays (JS convention: 0=Sun .. 6=Sat) into a table var
    DECLARE @weeklyOff NVARCHAR(200) = ISNULL((SELECT SettingValue FROM dbo.tblAppSetting WHERE SettingKey = N'WeeklyOffDays'), N'0,6');
    DECLARE @WO TABLE (d INT PRIMARY KEY);
    INSERT @WO (d)
    SELECT DISTINCT TRY_CAST(value AS INT)
    FROM STRING_SPLIT(@weeklyOff, ',')
    WHERE TRY_CAST(value AS INT) BETWEEN 0 AND 6;

    -- Working days in the month (19000107 is a Sunday -> %7: 0=Sun..6=Sat)
    DECLARE @days INT = DAY(EOMONTH(DATEFROMPARTS(@Year, @Month, 1)));
    DECLARE @WorkingDays INT;
    ;WITH nums AS (
        SELECT TOP (@days) ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS d
        FROM sys.all_objects
    )
    SELECT @WorkingDays = COUNT(*)
    FROM nums n
    CROSS APPLY (SELECT DATEFROMPARTS(@Year, @Month, n.d) AS dt) x
    WHERE (DATEDIFF(DAY, '19000107', x.dt) % 7) NOT IN (SELECT d FROM @WO)
      AND NOT EXISTS (SELECT 1 FROM dbo.tblHoliday h WHERE h.HolidayDate = x.dt);

    -- Manual override for this month wins over the auto count, if present
    SET @WorkingDays = ISNULL((SELECT WorkingDays FROM dbo.tblWorkingDays WHERE YearNo = @Year AND MonthNo = @Month), @WorkingDays);

    -- Reference day the snapshot counts / pies are taken on:
    --  * current month  -> @Today (preserves "today" behaviour)
    --  * any other month -> the latest date in that month that actually has attendance
    --                       (falls back to the last calendar day of the month)
    DECLARE @Ref DATE;
    IF (@Year = YEAR(@Today) AND @Month = MONTH(@Today))
        SET @Ref = @Today;
    ELSE
        SET @Ref = ISNULL(
            (SELECT MAX(a.AttDate) FROM dbo.tblAttendance a JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
             WHERE YEAR(a.AttDate) = @Year AND MONTH(a.AttDate) = @Month
               AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)),
            EOMONTH(DATEFROMPARTS(@Year, @Month, 1)));

    -- 1) Top summary counts (one row)
    SELECT
        RefDate          = @Ref,
        PresentToday     = (SELECT COUNT(*) FROM dbo.tblAttendance a JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
                            WHERE a.AttDate = @Ref AND a.StatusCode = 'P' AND e.IsActive = 1
                              AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)),
        AbsentLeaveToday = (SELECT COUNT(*) FROM dbo.tblAttendance a JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
                            WHERE a.AttDate = @Ref AND a.StatusCode IN ('A', 'L', 'HD') AND e.IsActive = 1
                              AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)),
        TotalEmployees   = (SELECT COUNT(*) FROM dbo.tblEmployee WHERE IsActive = 1
                              AND (@DepartmentId IS NULL OR DepartmentId = @DepartmentId)),
        WorkingDays      = @WorkingDays,
        PermissionToday  = (SELECT COUNT(*) FROM dbo.tblHourlyPermission p JOIN dbo.tblEmployee e ON e.EmployeeId = p.EmployeeId
                            WHERE p.PermDate = @Ref AND e.IsActive = 1
                              AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId));

    -- 2) Employee-wise monthly summary
    SELECT
        e.EmployeeCode,
        e.Name,
        -- Accumulated leave days: Leave + Absent (full) + Half-day (0.5)
        LeaveDays       = SUM(CASE WHEN a.StatusCode IN ('L', 'A') THEN 1.0 WHEN a.StatusCode = 'HD' THEN 0.5 ELSE 0 END),
        SickLeave       = CAST(1 AS DECIMAL(5,1)),
        WorkingDays     = @WorkingDays,
        -- Present marked on a weekly-off day or holiday = extra day worked (wo/h come from joins, not subqueries)
        HolidaysWorking = SUM(CASE WHEN a.StatusCode = 'P' AND (wo.d IS NOT NULL OR h.HolidayDate IS NOT NULL) THEN 1 ELSE 0 END)
    FROM dbo.tblEmployee e
    LEFT JOIN dbo.tblAttendance a
        ON a.EmployeeId = e.EmployeeId
       AND YEAR(a.AttDate) = @Year AND MONTH(a.AttDate) = @Month
    LEFT JOIN dbo.tblHoliday h ON h.HolidayDate = a.AttDate
    LEFT JOIN @WO wo ON wo.d = (DATEDIFF(DAY, '19000107', a.AttDate) % 7)
    WHERE e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    GROUP BY e.EmployeeCode, e.Name
    ORDER BY e.Name;

    -- 3) Department-wise present + leave + hourly permission on the reference day (for the pie charts)
    SELECT d.DepartmentName,
           EmployeeCount = COUNT(DISTINCT e.EmployeeId),
           PresentCount = COUNT(CASE WHEN a.StatusCode = 'P' THEN 1 END),
           LeaveCount   = COUNT(CASE WHEN a.StatusCode IN ('A', 'L', 'HD') THEN 1 END),
           PermissionCount = (SELECT COUNT(DISTINCT p.EmployeeId)
                              FROM dbo.tblHourlyPermission p
                              JOIN dbo.tblEmployee e2 ON e2.EmployeeId = p.EmployeeId
                              WHERE e2.DepartmentId = d.DepartmentId AND e2.IsActive = 1 AND p.PermDate = @Ref)
    FROM dbo.tblDepartment d
    LEFT JOIN dbo.tblEmployee e
        ON e.DepartmentId = d.DepartmentId AND e.IsActive = 1
    LEFT JOIN dbo.tblAttendance a
        ON a.EmployeeId = e.EmployeeId AND a.AttDate = @Ref
    WHERE d.IsActive = 1
      AND (@DepartmentId IS NULL OR d.DepartmentId = @DepartmentId)
    GROUP BY d.DepartmentId, d.DepartmentName
    ORDER BY d.DepartmentName;

    -- 4) Absent / leave employees on the reference day (for the drill-down popup)
    SELECT e.EmployeeCode,
           e.Name,
           DepartmentName = d.DepartmentName,
           a.StatusCode
    FROM dbo.tblAttendance a
    JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE a.AttDate = @Ref
      AND a.StatusCode IN ('A', 'L', 'HD')
      AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY e.Name;

    -- 5) Hourly-permission employees on the reference day (for the drill-down popup)
    SELECT e.EmployeeCode,
           e.Name,
           DepartmentName = d.DepartmentName,
           p.FromTime, p.ToTime,
           Hours = CAST(DATEDIFF(MINUTE, p.FromTime, p.ToTime) / 60.0 AS DECIMAL(4,2)),
           p.Reason
    FROM dbo.tblHourlyPermission p
    JOIN dbo.tblEmployee e ON e.EmployeeId = p.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE p.PermDate = @Ref
      AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY e.Name;
END
GO
