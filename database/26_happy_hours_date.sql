/* =====================================================================
   Unipro Attendance - Happy Hours: add a Date column
   Adds tblHappyHours.EventDate and threads it through the procedures.
   Run against ATTANDANCE_IMP after 25_happy_hours.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF COL_LENGTH('dbo.tblHappyHours', 'EventDate') IS NULL
    ALTER TABLE dbo.tblHappyHours ADD EventDate DATE NULL;
GO

CREATE OR ALTER PROCEDURE dbo.SP_HappyHours_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT HappyHourId, Title, DayName, EventDate, StartTime, EndTime, LocationAddress, IsActive
    FROM dbo.tblHappyHours
    ORDER BY HappyHourId DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_HappyHours_Save
    @HappyHourId     INT           = NULL,
    @Title           NVARCHAR(100),
    @DayName         NVARCHAR(15)  = NULL,
    @EventDate       DATE          = NULL,
    @StartTime       NVARCHAR(10)  = NULL,
    @EndTime         NVARCHAR(10)  = NULL,
    @LocationAddress NVARCHAR(300) = NULL,
    @IsActive        BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF @HappyHourId IS NULL
    BEGIN
        INSERT dbo.tblHappyHours (Title, DayName, EventDate, StartTime, EndTime, LocationAddress, IsActive)
        VALUES (@Title, @DayName, @EventDate, @StartTime, @EndTime, @LocationAddress, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT);
    END
    ELSE
    BEGIN
        UPDATE dbo.tblHappyHours
        SET Title = @Title, DayName = @DayName, EventDate = @EventDate, StartTime = @StartTime,
            EndTime = @EndTime, LocationAddress = @LocationAddress, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE HappyHourId = @HappyHourId;
        SELECT @HappyHourId;
    END
END
GO
