/* =====================================================================
   Unipro Attendance - Employee master: extra personal + emergency fields
   Adds Gender, DOB, Marital Status, Blood Group, Nationality, Photo,
   Address and emergency-contact columns. Run after 08_masters_procedures.sql.
   Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF COL_LENGTH('dbo.tblEmployee', 'Gender')            IS NULL ALTER TABLE dbo.tblEmployee ADD Gender            NVARCHAR(10)  NULL;
IF COL_LENGTH('dbo.tblEmployee', 'DateOfBirth')       IS NULL ALTER TABLE dbo.tblEmployee ADD DateOfBirth       DATE          NULL;
IF COL_LENGTH('dbo.tblEmployee', 'MaritalStatus')     IS NULL ALTER TABLE dbo.tblEmployee ADD MaritalStatus     NVARCHAR(20)  NULL;
IF COL_LENGTH('dbo.tblEmployee', 'BloodGroup')        IS NULL ALTER TABLE dbo.tblEmployee ADD BloodGroup        NVARCHAR(5)   NULL;
IF COL_LENGTH('dbo.tblEmployee', 'Nationality')       IS NULL ALTER TABLE dbo.tblEmployee ADD Nationality       NVARCHAR(50)  NULL;
IF COL_LENGTH('dbo.tblEmployee', 'Photo')             IS NULL ALTER TABLE dbo.tblEmployee ADD Photo             NVARCHAR(MAX) NULL;   -- base64 data URI
IF COL_LENGTH('dbo.tblEmployee', 'PhotoName')         IS NULL ALTER TABLE dbo.tblEmployee ADD PhotoName         NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.tblEmployee', 'Address')           IS NULL ALTER TABLE dbo.tblEmployee ADD Address           NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.tblEmployee', 'EmergencyName')     IS NULL ALTER TABLE dbo.tblEmployee ADD EmergencyName     NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.tblEmployee', 'EmergencyNumber')   IS NULL ALTER TABLE dbo.tblEmployee ADD EmergencyNumber   NVARCHAR(20)  NULL;
IF COL_LENGTH('dbo.tblEmployee', 'EmergencyRelation') IS NULL ALTER TABLE dbo.tblEmployee ADD EmergencyRelation NVARCHAR(50)  NULL;
GO

CREATE OR ALTER PROCEDURE dbo.SP_Employee_GetById
    @EmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT EmployeeId, EmployeeCode, Name, Email, Mobile, DepartmentId, DesignationId, Shift, JoiningDate, IsActive,
           Gender, DateOfBirth, MaritalStatus, BloodGroup, Nationality, Photo, PhotoName, Address,
           EmergencyName, EmergencyNumber, EmergencyRelation
    FROM dbo.tblEmployee WHERE EmployeeId = @EmployeeId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Employee_Save
    @EmployeeId        INT = NULL,
    @EmployeeCode      NVARCHAR(30),
    @Name              NVARCHAR(100),
    @Email             NVARCHAR(150) = NULL,
    @Mobile            NVARCHAR(20)  = NULL,
    @DepartmentId      INT = NULL,
    @DesignationId     INT = NULL,
    @Shift             NVARCHAR(50)  = NULL,
    @JoiningDate       DATE = NULL,
    @IsActive          BIT = 1,
    @Gender            NVARCHAR(10)  = NULL,
    @DateOfBirth       DATE = NULL,
    @MaritalStatus     NVARCHAR(20)  = NULL,
    @BloodGroup        NVARCHAR(5)   = NULL,
    @Nationality       NVARCHAR(50)  = NULL,
    @Photo             NVARCHAR(MAX) = NULL,
    @PhotoName         NVARCHAR(200) = NULL,
    @Address           NVARCHAR(300) = NULL,
    @EmergencyName     NVARCHAR(100) = NULL,
    @EmergencyNumber   NVARCHAR(20)  = NULL,
    @EmergencyRelation NVARCHAR(50)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF (@EmployeeId IS NULL OR @EmployeeId = 0)
    BEGIN
        INSERT dbo.tblEmployee (EmployeeCode, Name, Email, Mobile, DepartmentId, DesignationId, Shift, JoiningDate, IsActive,
            Gender, DateOfBirth, MaritalStatus, BloodGroup, Nationality, Photo, PhotoName, Address,
            EmergencyName, EmergencyNumber, EmergencyRelation)
        VALUES (@EmployeeCode, @Name, @Email, @Mobile, @DepartmentId, @DesignationId, @Shift, @JoiningDate, @IsActive,
            @Gender, @DateOfBirth, @MaritalStatus, @BloodGroup, @Nationality, @Photo, @PhotoName, @Address,
            @EmergencyName, @EmergencyNumber, @EmergencyRelation);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS EmployeeId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblEmployee
            SET EmployeeCode = @EmployeeCode, Name = @Name, Email = @Email, Mobile = @Mobile,
                DepartmentId = @DepartmentId, DesignationId = @DesignationId, Shift = @Shift,
                JoiningDate = @JoiningDate, IsActive = @IsActive,
                Gender = @Gender, DateOfBirth = @DateOfBirth, MaritalStatus = @MaritalStatus,
                BloodGroup = @BloodGroup, Nationality = @Nationality, Photo = @Photo, PhotoName = @PhotoName,
                Address = @Address, EmergencyName = @EmergencyName, EmergencyNumber = @EmergencyNumber,
                EmergencyRelation = @EmergencyRelation, UpdatedAt = SYSUTCDATETIME()
        WHERE EmployeeId = @EmployeeId;
        SELECT @EmployeeId AS EmployeeId;
    END
END
GO
