/* =====================================================================
   Unipro Attendance - Masters - PROCEDURES  (SP_*)
   Run after 07_masters_seed.sql. All CREATE OR ALTER (re-runnable).
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ========================= DEPARTMENT ========================= */
CREATE OR ALTER PROCEDURE dbo.SP_Department_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DepartmentId, DepartmentCode, DepartmentName, Head, IsActive
    FROM dbo.tblDepartment ORDER BY DepartmentName;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Department_Save
    @DepartmentId   INT = NULL,
    @DepartmentCode NVARCHAR(30),
    @DepartmentName NVARCHAR(100),
    @Head           NVARCHAR(100) = NULL,
    @IsActive       BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@DepartmentId IS NULL OR @DepartmentId = 0)
    BEGIN
        INSERT dbo.tblDepartment (DepartmentCode, DepartmentName, Head, IsActive)
        VALUES (@DepartmentCode, @DepartmentName, @Head, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS DepartmentId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblDepartment
            SET DepartmentCode = @DepartmentCode, DepartmentName = @DepartmentName,
                Head = @Head, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE DepartmentId = @DepartmentId;
        SELECT @DepartmentId AS DepartmentId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Department_SetActive
    @DepartmentId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblDepartment SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE DepartmentId = @DepartmentId;
END
GO

/* ========================= DESIGNATION ========================= */
CREATE OR ALTER PROCEDURE dbo.SP_Designation_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DesignationId, DesignationCode, DesignationName, IsActive
    FROM dbo.tblDesignation ORDER BY DesignationName;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Designation_Save
    @DesignationId   INT = NULL,
    @DesignationCode NVARCHAR(30),
    @DesignationName NVARCHAR(100),
    @IsActive        BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@DesignationId IS NULL OR @DesignationId = 0)
    BEGIN
        INSERT dbo.tblDesignation (DesignationCode, DesignationName, IsActive)
        VALUES (@DesignationCode, @DesignationName, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS DesignationId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblDesignation
            SET DesignationCode = @DesignationCode, DesignationName = @DesignationName,
                IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE DesignationId = @DesignationId;
        SELECT @DesignationId AS DesignationId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Designation_SetActive
    @DesignationId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblDesignation SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE DesignationId = @DesignationId;
END
GO

/* ========================= EMPLOYEE ========================= */
CREATE OR ALTER PROCEDURE dbo.SP_Employee_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT e.EmployeeId, e.EmployeeCode, e.Name, e.Email, e.Mobile,
           e.DepartmentId, d.DepartmentName,
           e.DesignationId, dg.DesignationName,
           e.Shift, e.JoiningDate, e.IsActive
    FROM dbo.tblEmployee e
    LEFT JOIN dbo.tblDepartment  d  ON d.DepartmentId  = e.DepartmentId
    LEFT JOIN dbo.tblDesignation dg ON dg.DesignationId = e.DesignationId
    ORDER BY e.Name;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Employee_GetById
    @EmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT EmployeeId, EmployeeCode, Name, Email, Mobile,
           DepartmentId, DesignationId, Shift, JoiningDate, IsActive
    FROM dbo.tblEmployee WHERE EmployeeId = @EmployeeId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Employee_Save
    @EmployeeId    INT = NULL,
    @EmployeeCode  NVARCHAR(30),
    @Name          NVARCHAR(100),
    @Email         NVARCHAR(150) = NULL,
    @Mobile        NVARCHAR(20)  = NULL,
    @DepartmentId  INT = NULL,
    @DesignationId INT = NULL,
    @Shift         NVARCHAR(50)  = NULL,
    @JoiningDate   DATE = NULL,
    @IsActive      BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@EmployeeId IS NULL OR @EmployeeId = 0)
    BEGIN
        INSERT dbo.tblEmployee (EmployeeCode, Name, Email, Mobile, DepartmentId, DesignationId, Shift, JoiningDate, IsActive)
        VALUES (@EmployeeCode, @Name, @Email, @Mobile, @DepartmentId, @DesignationId, @Shift, @JoiningDate, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS EmployeeId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblEmployee
            SET EmployeeCode = @EmployeeCode, Name = @Name, Email = @Email, Mobile = @Mobile,
                DepartmentId = @DepartmentId, DesignationId = @DesignationId, Shift = @Shift,
                JoiningDate = @JoiningDate, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE EmployeeId = @EmployeeId;
        SELECT @EmployeeId AS EmployeeId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Employee_SetActive
    @EmployeeId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblEmployee SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE EmployeeId = @EmployeeId;
END
GO

/* ========================= HOLIDAY ========================= */
CREATE OR ALTER PROCEDURE dbo.SP_Holiday_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT HolidayId, HolidayDate, HolidayName, HolidayType
    FROM dbo.tblHoliday ORDER BY HolidayDate;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Holiday_Save
    @HolidayId   INT = NULL,
    @HolidayDate DATE,
    @HolidayName NVARCHAR(150),
    @HolidayType NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF (@HolidayId IS NULL OR @HolidayId = 0)
    BEGIN
        INSERT dbo.tblHoliday (HolidayDate, HolidayName, HolidayType)
        VALUES (@HolidayDate, @HolidayName, @HolidayType);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS HolidayId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblHoliday
            SET HolidayDate = @HolidayDate, HolidayName = @HolidayName, HolidayType = @HolidayType
        WHERE HolidayId = @HolidayId;
        SELECT @HolidayId AS HolidayId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Holiday_Delete
    @HolidayId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblHoliday WHERE HolidayId = @HolidayId;
END
GO

/* ========================= LEAVE TYPE ========================= */
CREATE OR ALTER PROCEDURE dbo.SP_LeaveType_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT LeaveTypeId, LeaveTypeCode, LeaveName, MaxDays, IsPaid, IsActive
    FROM dbo.tblLeaveType ORDER BY LeaveName;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_LeaveType_Save
    @LeaveTypeId   INT = NULL,
    @LeaveTypeCode NVARCHAR(30),
    @LeaveName     NVARCHAR(100),
    @MaxDays       DECIMAL(5,1) = NULL,
    @IsPaid        BIT = 1,
    @IsActive      BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@LeaveTypeId IS NULL OR @LeaveTypeId = 0)
    BEGIN
        INSERT dbo.tblLeaveType (LeaveTypeCode, LeaveName, MaxDays, IsPaid, IsActive)
        VALUES (@LeaveTypeCode, @LeaveName, @MaxDays, @IsPaid, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS LeaveTypeId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblLeaveType
            SET LeaveTypeCode = @LeaveTypeCode, LeaveName = @LeaveName, MaxDays = @MaxDays,
                IsPaid = @IsPaid, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE LeaveTypeId = @LeaveTypeId;
        SELECT @LeaveTypeId AS LeaveTypeId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_LeaveType_SetActive
    @LeaveTypeId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblLeaveType SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE LeaveTypeId = @LeaveTypeId;
END
GO

/* ========================= OFFICE ========================= */
-- List WITHOUT the photo blob (fast); HasPhoto flag tells the UI a photo exists.
CREATE OR ALTER PROCEDURE dbo.SP_Office_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT OfficeId, OfficeCode, LocationName, Address, IsActive,
           HasPhoto = CASE WHEN PhotoBase64 IS NULL THEN 0 ELSE 1 END
    FROM dbo.tblOffice ORDER BY LocationName;
END
GO

-- Full row incl. photo (for edit / preview).
CREATE OR ALTER PROCEDURE dbo.SP_Office_GetById
    @OfficeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT OfficeId, OfficeCode, LocationName, Address, PhotoBase64, PhotoName, IsActive
    FROM dbo.tblOffice WHERE OfficeId = @OfficeId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Office_Save
    @OfficeId     INT = NULL,
    @OfficeCode   NVARCHAR(30),
    @LocationName NVARCHAR(100),
    @Address      NVARCHAR(300) = NULL,
    @PhotoBase64  NVARCHAR(MAX) = NULL,
    @PhotoName    NVARCHAR(200) = NULL,
    @IsActive     BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@OfficeId IS NULL OR @OfficeId = 0)
    BEGIN
        INSERT dbo.tblOffice (OfficeCode, LocationName, Address, PhotoBase64, PhotoName, IsActive)
        VALUES (@OfficeCode, @LocationName, @Address, @PhotoBase64, @PhotoName, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS OfficeId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblOffice
            SET OfficeCode = @OfficeCode, LocationName = @LocationName, Address = @Address,
                PhotoBase64 = @PhotoBase64, PhotoName = @PhotoName, IsActive = @IsActive,
                UpdatedAt = SYSUTCDATETIME()
        WHERE OfficeId = @OfficeId;
        SELECT @OfficeId AS OfficeId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Office_SetActive
    @OfficeId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblOffice SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE OfficeId = @OfficeId;
END
GO

/* =====================================================================
   DELETE procedures — allowed ONLY when the record is not mapped anywhere.
   If it is mapped they RAISERROR a friendly message (the API surfaces it
   to the user in a message box).
   ===================================================================== */

CREATE OR ALTER PROCEDURE dbo.SP_Department_Delete
    @DepartmentId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.tblEmployee WHERE DepartmentId = @DepartmentId)
    BEGIN
        RAISERROR (N'This department is already mapped to one or more employees, so it cannot be deleted.', 16, 1);
        RETURN;
    END
    DELETE FROM dbo.tblDepartment WHERE DepartmentId = @DepartmentId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Designation_Delete
    @DesignationId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.tblEmployee WHERE DesignationId = @DesignationId)
    BEGIN
        RAISERROR (N'This designation is already mapped to one or more employees, so it cannot be deleted.', 16, 1);
        RETURN;
    END
    DELETE FROM dbo.tblDesignation WHERE DesignationId = @DesignationId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Employee_Delete
    @EmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.tblAttendance WHERE EmployeeId = @EmployeeId)
    BEGIN
        RAISERROR (N'This employee already has attendance records, so it cannot be deleted.', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM dbo.tblLeave WHERE EmployeeId = @EmployeeId)
    BEGIN
        RAISERROR (N'This employee is mapped to the leave register, so it cannot be deleted.', 16, 1);
        RETURN;
    END
    DELETE FROM dbo.tblEmployee WHERE EmployeeId = @EmployeeId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_LeaveType_Delete
    @LeaveTypeId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.tblLeave WHERE LeaveTypeId = @LeaveTypeId)
    BEGIN
        RAISERROR (N'This leave type is already used in the leave register, so it cannot be deleted.', 16, 1);
        RETURN;
    END
    DELETE FROM dbo.tblLeaveType WHERE LeaveTypeId = @LeaveTypeId;
END
GO

-- Office is not referenced by any other table, so it can always be deleted.
CREATE OR ALTER PROCEDURE dbo.SP_Office_Delete
    @OfficeId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblOffice WHERE OfficeId = @OfficeId;
END
GO
