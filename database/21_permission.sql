/* =====================================================================
   Unipro Attendance - Hourly Permission Entry
   Logs short (few-hour) permissions per employee for a date/time range.
   Run after 09_attendance_tables.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblHourlyPermission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblHourlyPermission
    (
        PermissionId INT           IDENTITY(1,1) NOT NULL,
        EmployeeId   INT           NOT NULL,
        PermDate     DATE          NOT NULL,
        FromTime     TIME(0)       NOT NULL,
        ToTime       TIME(0)       NOT NULL,
        Reason       NVARCHAR(200) NULL,
        Remarks      NVARCHAR(300) NULL,
        CreatedAt    DATETIME2(0)  NOT NULL CONSTRAINT DF_Perm_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(0)  NULL,
        CONSTRAINT PK_tblHourlyPermission PRIMARY KEY (PermissionId),
        CONSTRAINT FK_Perm_Employee FOREIGN KEY (EmployeeId) REFERENCES dbo.tblEmployee(EmployeeId)
    );
    CREATE INDEX IX_Perm_EmpDate ON dbo.tblHourlyPermission (EmployeeId, PermDate);
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Permission_GetAll
    @Year INT = NULL, @Month INT = NULL, @DepartmentId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.PermissionId, p.EmployeeId, e.EmployeeCode, e.Name AS EmployeeName,
           d.DepartmentName, p.PermDate, p.FromTime, p.ToTime,
           Hours = CAST(DATEDIFF(MINUTE, p.FromTime, p.ToTime) / 60.0 AS DECIMAL(4,2)),
           p.Reason, p.Remarks
    FROM dbo.tblHourlyPermission p
    JOIN dbo.tblEmployee e ON e.EmployeeId = p.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE (@Year  IS NULL OR YEAR(p.PermDate)  = @Year)
      AND (@Month IS NULL OR MONTH(p.PermDate) = @Month)
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
    ORDER BY p.PermDate DESC, e.Name;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Permission_GetById
    @PermissionId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT PermissionId, EmployeeId, PermDate, FromTime, ToTime, Reason, Remarks
    FROM dbo.tblHourlyPermission WHERE PermissionId = @PermissionId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Permission_Save
    @PermissionId INT = NULL,
    @EmployeeId   INT,
    @PermDate     DATE,
    @FromTime     TIME(0),
    @ToTime       TIME(0),
    @Reason       NVARCHAR(200) = NULL,
    @Remarks      NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF (@PermissionId IS NULL OR @PermissionId = 0)
    BEGIN
        INSERT dbo.tblHourlyPermission (EmployeeId, PermDate, FromTime, ToTime, Reason, Remarks)
        VALUES (@EmployeeId, @PermDate, @FromTime, @ToTime, @Reason, @Remarks);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS PermissionId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblHourlyPermission
            SET EmployeeId = @EmployeeId, PermDate = @PermDate, FromTime = @FromTime,
                ToTime = @ToTime, Reason = @Reason, Remarks = @Remarks, UpdatedAt = SYSUTCDATETIME()
        WHERE PermissionId = @PermissionId;
        SELECT @PermissionId AS PermissionId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Permission_Delete
    @PermissionId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblHourlyPermission WHERE PermissionId = @PermissionId;
END
GO
