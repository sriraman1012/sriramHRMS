/* =====================================================================
   Unipro Attendance - Manual Working-Days override per month
   Run BEFORE re-running 12_dashboard_procedures.sql. Safe to re-run.
   If a month has a row here, that value overrides the auto calculation.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblWorkingDays', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblWorkingDays
    (
        YearNo      INT NOT NULL,
        MonthNo     INT NOT NULL,
        WorkingDays INT NOT NULL,
        UpdatedAt   DATETIME2(0) NULL,
        CONSTRAINT PK_tblWorkingDays PRIMARY KEY (YearNo, MonthNo)
    );
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_WorkingDays_Get
    @Year INT,
    @Month INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT WorkingDays FROM dbo.tblWorkingDays WHERE YearNo = @Year AND MonthNo = @Month;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_WorkingDays_Set
    @Year        INT,
    @Month       INT,
    @WorkingDays INT
AS
BEGIN
    SET NOCOUNT ON;
    MERGE dbo.tblWorkingDays AS t
    USING (SELECT @Year AS Y, @Month AS M) AS s
        ON t.YearNo = s.Y AND t.MonthNo = s.M
    WHEN MATCHED THEN UPDATE SET WorkingDays = @WorkingDays, UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN INSERT (YearNo, MonthNo, WorkingDays, UpdatedAt) VALUES (@Year, @Month, @WorkingDays, SYSUTCDATETIME());
END
GO
