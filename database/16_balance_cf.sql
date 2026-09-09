/* =====================================================================
   Unipro Attendance - Balance Carry Forward register
   Stores the monthly carry-forward snapshot + a manual deduction/remarks
   per employee. The carry-forward itself is computed from attendance
   (Gross Working Days - Working Days); this table holds the manual
   adjustment the user enters and saves.
   Run after 09_attendance_tables.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblBalanceCarryForward', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblBalanceCarryForward
    (
        BcfId        INT           IDENTITY(1,1) NOT NULL,
        EmployeeId   INT           NOT NULL,
        YearNo       INT           NOT NULL,
        MonthNo      INT           NOT NULL,
        CarryForward DECIMAL(6,1)  NOT NULL CONSTRAINT DF_BCF_CF      DEFAULT (0),  -- snapshot at save
        Deducted     DECIMAL(6,1)  NOT NULL CONSTRAINT DF_BCF_Ded     DEFAULT (0),  -- manual deduction
        Remarks      NVARCHAR(300) NULL,
        UpdatedAt    DATETIME2(0)  NOT NULL CONSTRAINT DF_BCF_Upd      DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_tblBalanceCarryForward PRIMARY KEY (BcfId),
        CONSTRAINT UQ_BCF_EmpMonth UNIQUE (EmployeeId, YearNo, MonthNo),
        CONSTRAINT FK_BCF_Employee FOREIGN KEY (EmployeeId) REFERENCES dbo.tblEmployee(EmployeeId)
    );
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_BalanceCF_GetByMonth
    @Year INT, @Month INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT EmployeeId, CarryForward, Deducted, Remarks
    FROM dbo.tblBalanceCarryForward
    WHERE YearNo = @Year AND MonthNo = @Month;
END
GO

-- @ItemsJson: [{"employeeId":1,"carryForward":4,"deducted":1,"remarks":"..."}, ...]
CREATE OR ALTER PROCEDURE dbo.SP_BalanceCF_Save
    @Year INT, @Month INT, @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    MERGE dbo.tblBalanceCarryForward AS t
    USING (
        SELECT EmployeeId, CarryForward, Deducted, Remarks
        FROM OPENJSON(@ItemsJson)
        WITH (
            EmployeeId   INT           '$.employeeId',
            CarryForward DECIMAL(6,1)  '$.carryForward',
            Deducted     DECIMAL(6,1)  '$.deducted',
            Remarks      NVARCHAR(300) '$.remarks'
        )
    ) AS s
    ON t.EmployeeId = s.EmployeeId AND t.YearNo = @Year AND t.MonthNo = @Month
    WHEN MATCHED THEN
        UPDATE SET CarryForward = s.CarryForward, Deducted = s.Deducted, Remarks = s.Remarks, UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (EmployeeId, YearNo, MonthNo, CarryForward, Deducted, Remarks)
        VALUES (s.EmployeeId, @Year, @Month, s.CarryForward, s.Deducted, s.Remarks);
END
GO
