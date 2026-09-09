/* =====================================================================
   Unipro Attendance - Add-ons MASTER
   The selectable add-ons used by New Client Implementation.
   Table + seed + CRUD procedures + RBAC module ('addon-master').
   Run against ATTANDANCE_IMP. Safe to re-run (idempotent).
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblAddon', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblAddon
    (
        AddonId      INT           IDENTITY(1,1) NOT NULL,
        AddonName    NVARCHAR(100) NOT NULL,
        DisplayOrder INT           NOT NULL CONSTRAINT DF_Addon_Order  DEFAULT (0),
        IsActive     BIT           NOT NULL CONSTRAINT DF_Addon_Active DEFAULT (1),
        CreatedAt    DATETIME2(0)  NOT NULL CONSTRAINT DF_Addon_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(0)  NULL,
        CONSTRAINT PK_tblAddon PRIMARY KEY (AddonId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tblAddon)
BEGIN
    INSERT dbo.tblAddon (AddonName, DisplayOrder)
    VALUES (N'Unibolt', 1), (N'Flitpos', 2), (N'COCKPIT', 3), (N'E-invoice', 4), (N'E-way', 5);
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Addon_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT AddonId, AddonName, DisplayOrder, IsActive
    FROM dbo.tblAddon ORDER BY DisplayOrder, AddonName;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Addon_Save
    @AddonId      INT = NULL,
    @AddonName    NVARCHAR(100),
    @DisplayOrder INT = 0,
    @IsActive     BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@AddonId IS NULL OR @AddonId = 0)
    BEGIN
        IF (@DisplayOrder = 0)
            SET @DisplayOrder = ISNULL((SELECT MAX(DisplayOrder) FROM dbo.tblAddon), 0) + 1;
        INSERT dbo.tblAddon (AddonName, DisplayOrder, IsActive)
        VALUES (@AddonName, @DisplayOrder, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS AddonId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblAddon
            SET AddonName = @AddonName, DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE AddonId = @AddonId;
        SELECT @AddonId AS AddonId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Addon_SetActive
    @AddonId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblAddon SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME() WHERE AddonId = @AddonId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Addon_Delete
    @AddonId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblAddon WHERE AddonId = @AddonId;
END
GO

/* ---- RBAC module for the master page ('addon-master' = nav key) ---- */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT 'addon-master', 'Add-ons Master', 11.6
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = 'addon-master');
GO
UPDATE dbo.tblModules SET IsActive = 1 WHERE ModuleCode = 'addon-master';
GO
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
DECLARE @modId INT = (SELECT ModuleId FROM dbo.tblModules WHERE ModuleCode = 'addon-master');
IF @adminId IS NOT NULL AND @modId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, @modId AS ModuleId) AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO

PRINT 'Add-ons master ready.';
GO
