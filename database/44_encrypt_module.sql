/* =====================================================================
   Unipro Attendance - Register the "Encrypt / Decrypt" module in RBAC.
   ModuleCode = the frontend nav key ('encrypt'). Grants the Admin group
   full rights. Safe to re-run (idempotent).
   Run against ATTANDANCE_IMP after 29_rbac_modules.sql.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* DisplayOrder 17.8 places it just after Implementation (17.5), before reports. */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT 'encrypt', 'Encrypt / Decrypt', 17.8
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = 'encrypt');
GO
UPDATE dbo.tblModules SET IsActive = 1 WHERE ModuleCode = 'encrypt';
GO

DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
DECLARE @modId INT = (SELECT ModuleId FROM dbo.tblModules WHERE ModuleCode = 'encrypt');
IF @adminId IS NOT NULL AND @modId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, @modId AS ModuleId) AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO

PRINT 'Encrypt / Decrypt module registered.';
GO
