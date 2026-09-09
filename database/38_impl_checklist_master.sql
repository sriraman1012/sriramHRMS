/* =====================================================================
   Unipro Attendance - Implementation Checklist MASTER
   A master list of installation checklist tasks, each flagged for
   Single-Location and/or Multiple-Location implementations.
   Includes table + seed + CRUD procedures + RBAC module ('impl-master').
   Run against ATTANDANCE_IMP. Safe to re-run (idempotent).
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---- Table ---- */
IF OBJECT_ID(N'dbo.tblImplChecklistItem', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblImplChecklistItem
    (
        ItemId       INT           IDENTITY(1,1) NOT NULL,
        TaskName     NVARCHAR(200) NOT NULL,
        ForSingle    BIT           NOT NULL CONSTRAINT DF_ImplItem_Single   DEFAULT (1),
        ForMultiple  BIT           NOT NULL CONSTRAINT DF_ImplItem_Multiple DEFAULT (1),
        DisplayOrder INT           NOT NULL CONSTRAINT DF_ImplItem_Order     DEFAULT (0),
        IsActive     BIT           NOT NULL CONSTRAINT DF_ImplItem_Active    DEFAULT (1),
        CreatedAt    DATETIME2(0)  NOT NULL CONSTRAINT DF_ImplItem_Created   DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(0)  NULL,
        CONSTRAINT PK_tblImplChecklistItem PRIMARY KEY (ItemId)
    );
END
GO

/* ---- Seed the default tasks once (only if the table is empty) ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.tblImplChecklistItem)
BEGIN
    INSERT dbo.tblImplChecklistItem (TaskName, ForSingle, ForMultiple, DisplayOrder)
    VALUES
        (N'SQL Installation',                       1, 1, 1),
        (N'SSMS',                                   1, 1, 2),
        (N'IIS Installation',                       1, 1, 3),
        (N'Windows Features',                       1, 1, 4),
        (N'Database Restore',                       1, 1, 5),
        (N'Crystal Reports Tools',                  1, 1, 6),
        (N'Build Hosting and Checking',             1, 1, 7),
        (N'API Hosting and Checking',               1, 1, 8),
        (N'Web Config / API URL',                   1, 1, 9),
        (N'Billing Installation / Config Checking', 1, 1, 10),
        (N'Offline Installation / Online Mode',     1, 1, 11),
        (N'Static IP / Port Opening',               1, 1, 12),
        (N'Barcode EXE / PRN Design',               1, 1, 13),
        (N'Sync Installation and Checking',         0, 1, 14);  -- multiple-location only
END
GO

/* ---- CRUD procedures ---- */
CREATE OR ALTER PROCEDURE dbo.SP_ImplChecklist_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ItemId, TaskName, ForSingle, ForMultiple, DisplayOrder, IsActive
    FROM dbo.tblImplChecklistItem
    ORDER BY DisplayOrder, TaskName;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_ImplChecklist_Save
    @ItemId       INT = NULL,
    @TaskName     NVARCHAR(200),
    @ForSingle    BIT = 1,
    @ForMultiple  BIT = 1,
    @DisplayOrder INT = 0,
    @IsActive     BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@ItemId IS NULL OR @ItemId = 0)
    BEGIN
        -- New rows default their order to the end when 0 is passed.
        IF (@DisplayOrder = 0)
            SET @DisplayOrder = ISNULL((SELECT MAX(DisplayOrder) FROM dbo.tblImplChecklistItem), 0) + 1;
        INSERT dbo.tblImplChecklistItem (TaskName, ForSingle, ForMultiple, DisplayOrder, IsActive)
        VALUES (@TaskName, @ForSingle, @ForMultiple, @DisplayOrder, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS ItemId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblImplChecklistItem
            SET TaskName = @TaskName, ForSingle = @ForSingle, ForMultiple = @ForMultiple,
                DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE ItemId = @ItemId;
        SELECT @ItemId AS ItemId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_ImplChecklist_SetActive
    @ItemId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblImplChecklistItem SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE ItemId = @ItemId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_ImplChecklist_Delete
    @ItemId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblImplChecklistItem WHERE ItemId = @ItemId;
END
GO

/* ---- RBAC module for the master page ('impl-master' = the nav key) ---- */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT 'impl-master', 'Implementation Checklist Master', 11.5
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = 'impl-master');
GO
UPDATE dbo.tblModules SET IsActive = 1 WHERE ModuleCode = 'impl-master';
GO
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
DECLARE @modId INT = (SELECT ModuleId FROM dbo.tblModules WHERE ModuleCode = 'impl-master');
IF @adminId IS NOT NULL AND @modId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, @modId AS ModuleId) AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO

PRINT 'Implementation Checklist master ready.';
GO
