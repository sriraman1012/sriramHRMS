/* =====================================================================
   Unipro Attendance - Attendance Entry - TABLE
   Run against ATTANDANCE_IMP. Safe to re-run.
   Codes: P, A, L, HD, H, WO
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblAttendance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblAttendance
    (
        AttendanceId INT          IDENTITY(1,1) NOT NULL,
        EmployeeId   INT          NOT NULL,
        AttDate      DATE         NOT NULL,
        StatusCode   NVARCHAR(5)  NOT NULL,
        CreatedAt    DATETIME2(0) NOT NULL CONSTRAINT DF_tblAttendance_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(0) NULL,
        CONSTRAINT PK_tblAttendance      PRIMARY KEY (AttendanceId),
        CONSTRAINT UQ_tblAttendance_EmpDate UNIQUE (EmployeeId, AttDate),
        CONSTRAINT FK_tblAttendance_Emp  FOREIGN KEY (EmployeeId) REFERENCES dbo.tblEmployee(EmployeeId)
    );
END
GO
