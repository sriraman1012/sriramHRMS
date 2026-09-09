/* =====================================================================
   Unipro Attendance - Happy Hours module (Attendance)
   Title · Day · Start Time · End Time · Location Address · Status.
   Run against ATTANDANCE_IMP. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblHappyHours', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblHappyHours
    (
        HappyHourId     INT           IDENTITY(1,1) NOT NULL,
        Title           NVARCHAR(100) NOT NULL,
        DayName         NVARCHAR(15)  NULL,
        StartTime       NVARCHAR(10)  NULL,   -- "HH:mm" (24h)
        EndTime         NVARCHAR(10)  NULL,   -- "HH:mm" (24h)
        LocationAddress NVARCHAR(300) NULL,
        IsActive        BIT           NOT NULL CONSTRAINT DF_tblHappyHours_IsActive DEFAULT (1),
        CreatedAt       DATETIME2(0)  NOT NULL CONSTRAINT DF_tblHappyHours_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(0)  NULL,
        CONSTRAINT PK_tblHappyHours PRIMARY KEY (HappyHourId)
    );
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_HappyHours_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT HappyHourId, Title, DayName, StartTime, EndTime, LocationAddress, IsActive
    FROM dbo.tblHappyHours
    ORDER BY HappyHourId DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_HappyHours_Save
    @HappyHourId     INT           = NULL,
    @Title           NVARCHAR(100),
    @DayName         NVARCHAR(15)  = NULL,
    @StartTime       NVARCHAR(10)  = NULL,
    @EndTime         NVARCHAR(10)  = NULL,
    @LocationAddress NVARCHAR(300) = NULL,
    @IsActive        BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF @HappyHourId IS NULL
    BEGIN
        INSERT dbo.tblHappyHours (Title, DayName, StartTime, EndTime, LocationAddress, IsActive)
        VALUES (@Title, @DayName, @StartTime, @EndTime, @LocationAddress, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT);
    END
    ELSE
    BEGIN
        UPDATE dbo.tblHappyHours
        SET Title = @Title, DayName = @DayName, StartTime = @StartTime, EndTime = @EndTime,
            LocationAddress = @LocationAddress, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE HappyHourId = @HappyHourId;
        SELECT @HappyHourId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_HappyHours_SetActive
    @HappyHourId INT,
    @IsActive    BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblHappyHours SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE HappyHourId = @HappyHourId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_HappyHours_Delete
    @HappyHourId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE dbo.tblHappyHours WHERE HappyHourId = @HappyHourId;
END
GO
