/* =====================================================================
   Unipro Attendance - "Present Onsite" (PO) support
   Adds a Note column (onsite customer / location) to attendance, threads it
   through GetSheet / SaveSheet / CopyPreviousMonth, and adds an onsite count +
   onsite list to the Home dashboard.
   Run against ATTANDANCE_IMP. Safe to re-run.
   Codes now: P, A, L, HD, H, WO, PO
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* 1) New column: onsite customer / place (only used for PO rows). */
IF COL_LENGTH('dbo.tblAttendance', 'Note') IS NULL
    ALTER TABLE dbo.tblAttendance ADD Note NVARCHAR(200) NULL;
GO

/* 2) Sheet read — now returns Note alongside each entry. */
CREATE OR ALTER PROCEDURE dbo.SP_Attendance_GetSheet
    @Year         INT,
    @Month        INT,
    @DepartmentId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT EmployeeId, EmployeeCode, Name
    FROM dbo.tblEmployee
    WHERE IsActive = 1
      AND (@DepartmentId IS NULL OR DepartmentId = @DepartmentId)
    ORDER BY EmployeeCode, Name;

    SELECT a.EmployeeId, DAY(a.AttDate) AS [Day], a.StatusCode, a.Note
    FROM dbo.tblAttendance a
    JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
    WHERE YEAR(a.AttDate) = @Year AND MONTH(a.AttDate) = @Month
      AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId);

    SELECT DAY(HolidayDate) AS [Day]
    FROM dbo.tblHoliday
    WHERE YEAR(HolidayDate) = @Year AND MONTH(HolidayDate) = @Month;
END
GO

/* 3) Sheet save — Note follows the payload (cleared for non-PO cells). */
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
               NULLIF(LTRIM(RTRIM(s.StatusCode)), N'') AS StatusCode,
               NULLIF(LTRIM(RTRIM(s.Note)), N'')       AS Note
        FROM OPENJSON(@EntriesJson)
        WITH (
            EmployeeId INT           '$.employeeId',
            [Day]      INT           '$.day',
            StatusCode NVARCHAR(5)   '$.statusCode',
            Note       NVARCHAR(200) '$.note'
        ) AS s
    ) AS src
    ON t.EmployeeId = src.EmployeeId AND t.AttDate = src.AttDate
    WHEN MATCHED AND src.StatusCode IS NULL THEN DELETE
    WHEN MATCHED THEN
        UPDATE SET StatusCode = src.StatusCode, Note = src.Note, UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED BY TARGET AND src.StatusCode IS NOT NULL THEN
        INSERT (EmployeeId, AttDate, StatusCode, Note, CreatedAt)
        VALUES (src.EmployeeId, src.AttDate, src.StatusCode, src.Note, SYSUTCDATETIME());
END
GO

/* 4) Copy previous month — carry the Note too. */
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
               a.StatusCode,
               a.Note
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
        UPDATE SET StatusCode = src.StatusCode, Note = src.Note, UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (EmployeeId, AttDate, StatusCode, Note, CreatedAt)
        VALUES (src.EmployeeId, src.AttDate, src.StatusCode, src.Note, SYSUTCDATETIME());

    SELECT @@ROWCOUNT AS RowsCopied;
END
GO

/* 5) Dashboard — add OnsiteToday count (set 1) + onsite list (new set 6). */
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

    -- 2) Employee-wise monthly summary  (PO counts as a present/working day too)
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
    WHERE a.AttDate = @Ref
      AND a.StatusCode IN ('A', 'L', 'HD')
      AND e.IsActive = 1
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
    WHERE p.PermDate = @Ref
      AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY e.Name;

    -- 6) Present-Onsite employees on the reference day (place = Note) for the drill-down popup
    SELECT e.EmployeeCode,
           e.Name,
           DepartmentName = d.DepartmentName,
           Place = a.Note
    FROM dbo.tblAttendance a
    JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE a.AttDate = @Ref
      AND a.StatusCode = 'PO'
      AND e.IsActive = 1
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY e.Name;
END
GO
