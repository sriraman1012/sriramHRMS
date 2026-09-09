/* =====================================================================
   Unipro Attendance - Leave Register (employee-wise)
   Run after 14_workingdays.sql. Safe to re-run.
   Registering/editing a leave marks attendance as 'L' for the range
   (skipping weekly-off days and holidays) AND remembers the previous
   status of each day. Deleting/editing restores that previous status.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblLeave', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblLeave
    (
        LeaveId     INT           IDENTITY(1,1) NOT NULL,
        EmployeeId  INT           NOT NULL,
        LeaveTypeId INT           NULL,
        FromDate    DATE          NOT NULL,
        ToDate      DATE          NOT NULL,
        Reason      NVARCHAR(300) NULL,
        Remarks     NVARCHAR(300) NULL,
        CreatedAt   DATETIME2(0)  NOT NULL CONSTRAINT DF_tblLeave_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt   DATETIME2(0)  NULL,
        CONSTRAINT PK_tblLeave PRIMARY KEY (LeaveId),
        CONSTRAINT FK_tblLeave_Emp  FOREIGN KEY (EmployeeId)  REFERENCES dbo.tblEmployee(EmployeeId),
        CONSTRAINT FK_tblLeave_Type FOREIGN KEY (LeaveTypeId) REFERENCES dbo.tblLeaveType(LeaveTypeId)
    );
END
GO

/* Remembers each day a leave marked and the status that was there before */
IF OBJECT_ID(N'dbo.tblLeaveMark', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblLeaveMark
    (
        LeaveMarkId INT          IDENTITY(1,1) NOT NULL,
        LeaveId     INT          NOT NULL,
        EmployeeId  INT          NOT NULL,
        AttDate     DATE         NOT NULL,
        PrevStatus  NVARCHAR(5)  NULL,   -- status before the leave; NULL = cell was empty
        CONSTRAINT PK_tblLeaveMark PRIMARY KEY (LeaveMarkId),
        CONSTRAINT FK_tblLeaveMark_Leave FOREIGN KEY (LeaveId) REFERENCES dbo.tblLeave(LeaveId)
    );
    CREATE INDEX IX_tblLeaveMark_Leave ON dbo.tblLeaveMark (LeaveId);
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Leave_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT l.LeaveId, l.EmployeeId, e.EmployeeCode, e.Name AS EmployeeName,
           l.LeaveTypeId, lt.LeaveName AS LeaveTypeName,
           l.FromDate, l.ToDate, l.Reason, l.Remarks
    FROM dbo.tblLeave l
    JOIN dbo.tblEmployee e ON e.EmployeeId = l.EmployeeId
    LEFT JOIN dbo.tblLeaveType lt ON lt.LeaveTypeId = l.LeaveTypeId
    ORDER BY l.FromDate DESC, e.Name;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Leave_GetById
    @LeaveId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT l.LeaveId, l.EmployeeId, e.EmployeeCode, e.Name AS EmployeeName,
           l.LeaveTypeId, lt.LeaveName AS LeaveTypeName,
           l.FromDate, l.ToDate, l.Reason, l.Remarks
    FROM dbo.tblLeave l
    JOIN dbo.tblEmployee e ON e.EmployeeId = l.EmployeeId
    LEFT JOIN dbo.tblLeaveType lt ON lt.LeaveTypeId = l.LeaveTypeId
    WHERE l.LeaveId = @LeaveId;
END
GO

/* Restores the previous attendance status for a leave's marks, then clears the marks. */
CREATE OR ALTER PROCEDURE dbo.SP_Leave_RevertMarks
    @LeaveId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.tblLeaveMark WHERE LeaveId = @LeaveId)
    BEGIN
        -- Put back the previous status where the leave's 'L' mark is still intact
        UPDATE a
            SET a.StatusCode = m.PrevStatus, a.UpdatedAt = SYSUTCDATETIME()
        FROM dbo.tblAttendance a
        JOIN dbo.tblLeaveMark m ON m.EmployeeId = a.EmployeeId AND m.AttDate = a.AttDate AND m.LeaveId = @LeaveId
        WHERE m.PrevStatus IS NOT NULL AND a.StatusCode = 'L';

        -- Remove cells the leave itself created (no previous status) that are still 'L'
        DELETE a
        FROM dbo.tblAttendance a
        JOIN dbo.tblLeaveMark m ON m.EmployeeId = a.EmployeeId AND m.AttDate = a.AttDate AND m.LeaveId = @LeaveId
        WHERE m.PrevStatus IS NULL AND a.StatusCode = 'L';

        DELETE FROM dbo.tblLeaveMark WHERE LeaveId = @LeaveId;
    END
    ELSE
    BEGIN
        -- Fallback for leaves created before marks existed: clear 'L' in the range
        DECLARE @emp INT, @from DATE, @to DATE;
        SELECT @emp = EmployeeId, @from = FromDate, @to = ToDate FROM dbo.tblLeave WHERE LeaveId = @LeaveId;
        IF @from IS NOT NULL
            DELETE FROM dbo.tblAttendance
            WHERE EmployeeId = @emp AND AttDate BETWEEN @from AND @to AND StatusCode = 'L';
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Leave_Save
    @LeaveId     INT = NULL,
    @EmployeeId  INT,
    @LeaveTypeId INT = NULL,
    @FromDate    DATE,
    @ToDate      DATE,
    @Reason      NVARCHAR(300) = NULL,
    @Remarks     NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Weekly-off weekdays into a table var
    DECLARE @weeklyOff NVARCHAR(200) = ISNULL((SELECT SettingValue FROM dbo.tblAppSetting WHERE SettingKey = N'WeeklyOffDays'), N'0,6');
    DECLARE @WO TABLE (d INT PRIMARY KEY);
    INSERT @WO (d)
    SELECT DISTINCT TRY_CAST(value AS INT) FROM STRING_SPLIT(@weeklyOff, ',') WHERE TRY_CAST(value AS INT) BETWEEN 0 AND 6;

    IF (@LeaveId IS NOT NULL AND @LeaveId <> 0)
    BEGIN
        -- Revert the old range first (restore previous statuses)
        EXEC dbo.SP_Leave_RevertMarks @LeaveId;
        UPDATE dbo.tblLeave
            SET EmployeeId = @EmployeeId, LeaveTypeId = @LeaveTypeId, FromDate = @FromDate,
                ToDate = @ToDate, Reason = @Reason, Remarks = @Remarks, UpdatedAt = SYSUTCDATETIME()
        WHERE LeaveId = @LeaveId;
    END
    ELSE
    BEGIN
        INSERT dbo.tblLeave (EmployeeId, LeaveTypeId, FromDate, ToDate, Reason, Remarks, CreatedAt)
        VALUES (@EmployeeId, @LeaveTypeId, @FromDate, @ToDate, @Reason, @Remarks, SYSUTCDATETIME());
        SET @LeaveId = CAST(SCOPE_IDENTITY() AS INT);
    END

    -- Build the working dates in the range (skip weekly-off + holidays)
    DECLARE @Dates TABLE (dt DATE PRIMARY KEY);
    ;WITH dates AS (
        SELECT @FromDate AS dt
        UNION ALL
        SELECT DATEADD(DAY, 1, dt) FROM dates WHERE dt < @ToDate
    )
    INSERT @Dates (dt) SELECT dt FROM dates OPTION (MAXRECURSION 366);

    DECLARE @Target TABLE (dt DATE PRIMARY KEY);
    INSERT @Target (dt)
    SELECT dd.dt FROM @Dates dd
    WHERE (DATEDIFF(DAY, '19000107', dd.dt) % 7) NOT IN (SELECT wo.d FROM @WO wo)
      AND NOT EXISTS (SELECT 1 FROM dbo.tblHoliday h WHERE h.HolidayDate = dd.dt);

    -- Remember the previous status for each target date
    INSERT dbo.tblLeaveMark (LeaveId, EmployeeId, AttDate, PrevStatus)
    SELECT @LeaveId, @EmployeeId, tg.dt, a.StatusCode
    FROM @Target tg
    LEFT JOIN dbo.tblAttendance a ON a.EmployeeId = @EmployeeId AND a.AttDate = tg.dt;

    -- Mark attendance 'L'
    MERGE dbo.tblAttendance AS t
    USING (SELECT dt AS AttDate FROM @Target) AS s
    ON t.EmployeeId = @EmployeeId AND t.AttDate = s.AttDate
    WHEN MATCHED THEN UPDATE SET StatusCode = 'L', UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (EmployeeId, AttDate, StatusCode, CreatedAt) VALUES (@EmployeeId, s.AttDate, 'L', SYSUTCDATETIME());

    SELECT @LeaveId AS LeaveId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Leave_Delete
    @LeaveId INT
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.SP_Leave_RevertMarks @LeaveId;   -- restore previous attendance status
    DELETE FROM dbo.tblLeave WHERE LeaveId = @LeaveId;
END
GO
