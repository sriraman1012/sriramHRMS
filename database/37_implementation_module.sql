/* =====================================================================
   Unipro Attendance - Register the "Implementation" module in RBAC.
   ModuleCode = the frontend nav key ('implementation') so rights map 1:1.
   Grants the Admin group full rights. Safe to re-run (idempotent).
   Run against ATTANDANCE_IMP after 29_rbac_modules.sql.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* Add the module if it isn't there yet (DisplayOrder after Happy Hours = 17, before reports). */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT 'implementation', 'Implementation Checklist', 17.5
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = 'implementation');
GO

/* Make sure it is active. */
UPDATE dbo.tblModules SET IsActive = 1 WHERE ModuleCode = 'implementation';
GO

/* Admin group: full rights on the new module. */
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
DECLARE @modId INT = (SELECT ModuleId FROM dbo.tblModules WHERE ModuleCode = 'implementation');
IF @adminId IS NOT NULL AND @modId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, @modId AS ModuleId) AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO

PRINT 'Implementation module registered.';
GO
