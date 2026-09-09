/* =====================================================================
   Unipro Attendance - Dashboard Present/Absent trend (line chart)
   SP_Dashboard_AttendanceTrend returns Present & Absent counts bucketed
   by day (a month), by month (a year), or by year.
     Present = StatusCode IN ('P','PO)   -- present incl. onsite
     Absent  = StatusCode IN ('A','L','HD')
   Only ACTIVE employees are counted; optional department filter.
   Run against ATTANDANCE_IMP after 31_chat_delete_log.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

CREATE OR ALTER PROCEDURE dbo.SP_Dashboard_AttendanceTrend
    @Mode         NVARCHAR(10) = 'date',   -- 'date' | 'month' | 'year'
    @Year         INT = NULL,
    @Month        INT = NULL,
    @DepartmentId INT = NULL,
    @From         DATE = NULL,             -- optional day-range (used in 'date' mode)
    @To           DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @Year  IS NULL SET @Year  = YEAR(GETDATE());
    IF @Month IS NULL OR @Month NOT BETWEEN 1 AND 12 SET @Month = MONTH(GETDATE());

    -- 'date' mode with an explicit From/To range: one point per day across [From, To].
    IF @Mode = 'date' AND @From IS NOT NULL AND @To IS NOT NULL
    BEGIN
        IF @To < @From SET @To = @From;
        ;WITH d AS (
            SELECT CAST(@From AS DATE) AS dt
            UNION ALL SELECT DATEADD(DAY, 1, dt) FROM d WHERE dt < @To
        )
        SELECT
            Bucket      = DATEDIFF(DAY, @From, d.dt) + 1,
            BucketLabel = LEFT(CONVERT(NVARCHAR(11), d.dt, 106), 6),   -- e.g. "04 Aug"
            Present     = ISNULL(SUM(CASE WHEN att.StatusCode IN ('P','PO')     THEN 1 ELSE 0 END), 0),
            Absent      = ISNULL(SUM(CASE WHEN att.StatusCode IN ('A','L','HD') THEN 1 ELSE 0 END), 0)
        FROM d
        LEFT JOIN (
            SELECT a.AttDate, a.StatusCode
            FROM dbo.tblAttendance a
            JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId AND e.IsActive = 1
            WHERE a.AttDate BETWEEN @From AND @To AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
        ) att ON att.AttDate = d.dt
        GROUP BY d.dt
        ORDER BY d.dt
        OPTION (MAXRECURSION 366);
        RETURN;
    END

    IF @Mode = 'year'
    BEGIN
        SELECT
            Bucket      = YEAR(a.AttDate),
            BucketLabel = CAST(YEAR(a.AttDate) AS NVARCHAR(4)),
            Present     = SUM(CASE WHEN a.StatusCode IN ('P','PO')     THEN 1 ELSE 0 END),
            Absent      = SUM(CASE WHEN a.StatusCode IN ('A','L','HD') THEN 1 ELSE 0 END)
        FROM dbo.tblAttendance a
        JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId AND e.IsActive = 1
        WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
        GROUP BY YEAR(a.AttDate)
        ORDER BY YEAR(a.AttDate);
    END
    ELSE IF @Mode = 'month'
    BEGIN
        -- All 12 months of @Year (zero-filled), Jan..Dec.
        ;WITH m AS (SELECT n FROM (VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12)) v(n))
        SELECT
            Bucket      = m.n,
            BucketLabel = LEFT(DATENAME(MONTH, DATEFROMPARTS(2000, m.n, 1)), 3),
            Present     = ISNULL(SUM(CASE WHEN att.StatusCode IN ('P','PO')     THEN 1 ELSE 0 END), 0),
            Absent      = ISNULL(SUM(CASE WHEN att.StatusCode IN ('A','L','HD') THEN 1 ELSE 0 END), 0)
        FROM m
        LEFT JOIN (
            SELECT a.AttDate, a.StatusCode
            FROM dbo.tblAttendance a
            JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId AND e.IsActive = 1
            WHERE YEAR(a.AttDate) = @Year AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
        ) att ON MONTH(att.AttDate) = m.n
        GROUP BY m.n
        ORDER BY m.n;
    END
    ELSE  -- 'date' : each day of @Year/@Month (zero-filled)
    BEGIN
        DECLARE @days INT = DAY(EOMONTH(DATEFROMPARTS(@Year, @Month, 1)));
        ;WITH d AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM d WHERE n < 31)
        SELECT
            Bucket      = d.n,
            BucketLabel = CAST(d.n AS NVARCHAR(2)),
            Present     = ISNULL(SUM(CASE WHEN att.StatusCode IN ('P','PO')     THEN 1 ELSE 0 END), 0),
            Absent      = ISNULL(SUM(CASE WHEN att.StatusCode IN ('A','L','HD') THEN 1 ELSE 0 END), 0)
        FROM d
        LEFT JOIN (
            SELECT a.AttDate, a.StatusCode
            FROM dbo.tblAttendance a
            JOIN dbo.tblEmployee e ON e.EmployeeId = a.EmployeeId AND e.IsActive = 1
            WHERE YEAR(a.AttDate) = @Year AND MONTH(a.AttDate) = @Month
              AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
        ) att ON DAY(att.AttDate) = d.n
        WHERE d.n <= @days
        GROUP BY d.n
        ORDER BY d.n
        OPTION (MAXRECURSION 40);
    END
END
GO
