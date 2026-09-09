/* =====================================================================
   Unipro Attendance - Flexible weekly-off (nth weekday)
   Adds a WeeklyOffNth setting (weekday -> occurrences off, e.g. {"6":[2,4]}
   = 2nd & 4th Saturday) and makes the dashboard working-day count respect it.
   Run against ATTANDANCE_IMP after 23_attendance_onsite.sql. Re-runnable.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tblAppSetting WHERE SettingKey = N'WeeklyOffNth')
    INSERT dbo.tblAppSetting (SettingKey, SettingValue) VALUES (N'WeeklyOffNth', N'{}');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Dashboard_Home
    @Year         INT,
    @Month        INT,
    @DepartmentId INT  = NULL,
    @Today        DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @weeklyOff NVARCHAR(200) = ISNULL((SELECT SettingValue FROM dbo.tblAppSetting WHERE SettingKey = N'WeeklyOffDays'), N'0,6');
    DECLARE @WO TABLE (d INT PRIMARY KEY);
    INSERT @WO (d)
    SELECT DISTINCT TRY_CAST(value AS INT)
    FROM STRING_SPLIT(@weeklyOff, ',')
    WHERE TRY_CAST(value AS INT) BETWEEN 0 AND 6;

    -- nth-weekday offs: {"6":[2,4]} -> rows (wd=6, occ=2), (wd=6, occ=4)
    DECLARE @nthJson NVARCHAR(200) = ISNULL((SELECT SettingValue FROM dbo.tblAppSetting WHERE SettingKey = N'WeeklyOffNth'), N'{}');
    DECLARE @NTH TABLE (wd INT, occ INT);
    BEGIN TRY
        INSERT @NTH (wd, occ)
        SELECT TRY_CAST(j.[key] AS INT), TRY_CAST(o.value AS INT)
        FROM OPENJSON(@nthJson) j
        CROSS APPLY OPENJSON(j.value) o
        WHERE TRY_CAST(j.[key] AS INT) BETWEEN 0 AND 6 AND TRY_CAST(o.value AS INT) BETWEEN 1 AND 6;
    END TRY BEGIN CATCH END CATCH;

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
      AND NOT EXISTS (SELECT 1 FROM @NTH t
                      WHERE t.wd = (DATEDIFF(DAY, '19000107', x.dt) % 7)
                        AND t.occ = ((DAY(x.dt) - 1) / 7) + 1)
      AND NOT EXISTS (SELECT 1 FROM dbo.tblHoliday h WHERE h.HolidayDate = x.dt);

    SET @WorkingDays = ISNULL((SELECT WorkingDays FROM dbo.tblWorkingDays WHERE YearNo = @Year AND MonthNo = @Month), @WorkingDays);

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
                              AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)),
        OnsiteToday      = (SELECT COUNT(*) FROM dbo.tblAttendance a JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
                            WHERE a.AttDate = @Ref AND a.StatusCode = 'PO' AND e.IsActive = 1
                              AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId));

    -- 2) Employee-wise monthly summary  (PO counts as present too)
    SELECT
        e.EmployeeCode,
        e.Name,
        LeaveDays       = SUM(CASE WHEN a.StatusCode IN ('L', 'A') THEN 1.0 WHEN a.StatusCode = 'HD' THEN 0.5 ELSE 0 END),
        SickLeave       = CAST(1 AS DECIMAL(5,1)),
        WorkingDays     = @WorkingDays,
        HolidaysWorking = SUM(CASE WHEN a.StatusCode IN ('P','PO') AND (wo.d IS NOT NULL OR h.HolidayDate IS NOT NULL) THEN 1 ELSE 0 END)
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

    -- 3) Department-wise present + leave + permission on the reference day (PO counts as present)
    SELECT d.DepartmentName,
           EmployeeCount = COUNT(DISTINCT e.EmployeeId),
           PresentCount = COUNT(CASE WHEN a.StatusCode IN ('P','PO') THEN 1 END),
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

    -- 4) Absent / leave employees on the reference day
    SELECT e.EmployeeCode, e.Name, DepartmentName = d.DepartmentName, a.StatusCode
    FROM dbo.tblAttendance a
    JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE a.AttDate = @Ref AND a.StatusCode IN ('A', 'L', 'HD') AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY e.Name;

    -- 5) Hourly-permission employees on the reference day
    SELECT e.EmployeeCode, e.Name, DepartmentName = d.DepartmentName,
           p.FromTime, p.ToTime,
           Hours = CAST(DATEDIFF(MINUTE, p.FromTime, p.ToTime) / 60.0 AS DECIMAL(4,2)),
           p.Reason
    FROM dbo.tblHourlyPermission p
    JOIN dbo.tblEmployee e ON e.EmployeeId = p.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE p.PermDate = @Ref AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY e.Name;

    -- 6) Present-Onsite employees on the reference day
    SELECT e.EmployeeCode, e.Name, DepartmentName = d.DepartmentName, Place = a.Note
    FROM dbo.tblAttendance a
    JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE a.AttDate = @Ref AND a.StatusCode = 'PO' AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY e.Name;
END
GO
