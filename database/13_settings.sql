/* =====================================================================
   Unipro Attendance - App Settings (Weekly Off days, etc.)
   Run BEFORE re-running 12_dashboard_procedures.sql. Safe to re-run.
   WeeklyOffDays stored as comma list of JS weekday numbers (0=Sun .. 6=Sat).
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblAppSetting', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblAppSetting
    (
        SettingKey   NVARCHAR(50)  NOT NULL,
        SettingValue NVARCHAR(200) NULL,
        UpdatedAt    DATETIME2(0)  NULL,
        CONSTRAINT PK_tblAppSetting PRIMARY KEY (SettingKey)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tblAppSetting WHERE SettingKey = N'WeeklyOffDays')
    INSERT dbo.tblAppSetting (SettingKey, SettingValue) VALUES (N'WeeklyOffDays', N'0,6');  -- Sun + Sat
GO

CREATE OR ALTER PROCEDURE dbo.SP_AppSetting_Get
    @Key NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SettingKey, SettingValue FROM dbo.tblAppSetting WHERE SettingKey = @Key;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_AppSetting_Set
    @Key   NVARCHAR(50),
    @Value NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    MERGE dbo.tblAppSetting AS t
    USING (SELECT @Key AS K) AS s ON t.SettingKey = s.K
    WHEN MATCHED THEN UPDATE SET SettingValue = @Value, UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN INSERT (SettingKey, SettingValue, UpdatedAt) VALUES (@Key, @Value, SYSUTCDATETIME());
END
GO
