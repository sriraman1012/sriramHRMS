/* =====================================================================
   Unipro Attendance - Masters - TABLES
   Run against ATTANDANCE_IMP. Safe to re-run.
   Codes are entered manually and enforced UNIQUE.
   Naming: tables = tbl* , procedures = SP_*
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---- Department ---- */
IF OBJECT_ID(N'dbo.tblDepartment', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblDepartment
    (
        DepartmentId   INT           IDENTITY(1,1) NOT NULL,
        DepartmentCode NVARCHAR(30)  NOT NULL,
        DepartmentName NVARCHAR(100) NOT NULL,
        Head           NVARCHAR(100) NULL,
        IsActive       BIT           NOT NULL CONSTRAINT DF_tblDepartment_IsActive DEFAULT (1),
        CreatedAt      DATETIME2(0)  NOT NULL CONSTRAINT DF_tblDepartment_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt      DATETIME2(0)  NULL,
        CONSTRAINT PK_tblDepartment      PRIMARY KEY (DepartmentId),
        CONSTRAINT UQ_tblDepartment_Code UNIQUE (DepartmentCode)
    );
END
GO

/* ---- Designation ---- */
IF OBJECT_ID(N'dbo.tblDesignation', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblDesignation
    (
        DesignationId   INT           IDENTITY(1,1) NOT NULL,
        DesignationCode NVARCHAR(30)  NOT NULL,
        DesignationName NVARCHAR(100) NOT NULL,
        IsActive        BIT           NOT NULL CONSTRAINT DF_tblDesignation_IsActive DEFAULT (1),
        CreatedAt       DATETIME2(0)  NOT NULL CONSTRAINT DF_tblDesignation_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(0)  NULL,
        CONSTRAINT PK_tblDesignation      PRIMARY KEY (DesignationId),
        CONSTRAINT UQ_tblDesignation_Code UNIQUE (DesignationCode)
    );
END
GO

/* ---- Employee ---- */
IF OBJECT_ID(N'dbo.tblEmployee', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblEmployee
    (
        EmployeeId    INT           IDENTITY(1,1) NOT NULL,
        EmployeeCode  NVARCHAR(30)  NOT NULL,
        Name          NVARCHAR(100) NOT NULL,
        Email         NVARCHAR(150) NULL,
        Mobile        NVARCHAR(20)  NULL,
        DepartmentId  INT           NULL,
        DesignationId INT           NULL,
        Shift         NVARCHAR(50)  NULL,
        JoiningDate   DATE          NULL,
        IsActive      BIT           NOT NULL CONSTRAINT DF_tblEmployee_IsActive DEFAULT (1),
        CreatedAt     DATETIME2(0)  NOT NULL CONSTRAINT DF_tblEmployee_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt     DATETIME2(0)  NULL,
        CONSTRAINT PK_tblEmployee      PRIMARY KEY (EmployeeId),
        CONSTRAINT UQ_tblEmployee_Code UNIQUE (EmployeeCode),
        CONSTRAINT FK_tblEmployee_Dept FOREIGN KEY (DepartmentId)  REFERENCES dbo.tblDepartment(DepartmentId),
        CONSTRAINT FK_tblEmployee_Desig FOREIGN KEY (DesignationId) REFERENCES dbo.tblDesignation(DesignationId)
    );
END
GO

/* ---- Holiday ---- */
IF OBJECT_ID(N'dbo.tblHoliday', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblHoliday
    (
        HolidayId   INT           IDENTITY(1,1) NOT NULL,
        HolidayDate DATE          NOT NULL,
        HolidayName NVARCHAR(150) NOT NULL,
        HolidayType NVARCHAR(30)  NULL,   -- Public / Optional / Company / Restricted
        CreatedAt   DATETIME2(0)  NOT NULL CONSTRAINT DF_tblHoliday_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_tblHoliday      PRIMARY KEY (HolidayId),
        CONSTRAINT UQ_tblHoliday_Date UNIQUE (HolidayDate)
    );
END
GO

/* ---- Leave Type ---- */
IF OBJECT_ID(N'dbo.tblLeaveType', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblLeaveType
    (
        LeaveTypeId   INT           IDENTITY(1,1) NOT NULL,
        LeaveTypeCode NVARCHAR(30)  NOT NULL,
        LeaveName     NVARCHAR(100) NOT NULL,
        MaxDays       DECIMAL(5,1)  NULL,
        IsPaid        BIT           NOT NULL CONSTRAINT DF_tblLeaveType_IsPaid DEFAULT (1),
        IsActive      BIT           NOT NULL CONSTRAINT DF_tblLeaveType_IsActive DEFAULT (1),
        CreatedAt     DATETIME2(0)  NOT NULL CONSTRAINT DF_tblLeaveType_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt     DATETIME2(0)  NULL,
        CONSTRAINT PK_tblLeaveType      PRIMARY KEY (LeaveTypeId),
        CONSTRAINT UQ_tblLeaveType_Code UNIQUE (LeaveTypeCode)
    );
END
GO

/* ---- Office / Location (photo stored as base64 data URI) ---- */
IF OBJECT_ID(N'dbo.tblOffice', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblOffice
    (
        OfficeId     INT            IDENTITY(1,1) NOT NULL,
        OfficeCode   NVARCHAR(30)   NOT NULL,
        LocationName NVARCHAR(100)  NOT NULL,
        Address      NVARCHAR(300)  NULL,
        PhotoBase64  NVARCHAR(MAX)  NULL,   -- data:image/...;base64,....
        PhotoName    NVARCHAR(200)  NULL,
        IsActive     BIT            NOT NULL CONSTRAINT DF_tblOffice_IsActive DEFAULT (1),
        CreatedAt    DATETIME2(0)   NOT NULL CONSTRAINT DF_tblOffice_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(0)   NULL,
        CONSTRAINT PK_tblOffice      PRIMARY KEY (OfficeId),
        CONSTRAINT UQ_tblOffice_Code UNIQUE (OfficeCode)
    );
END
GO
