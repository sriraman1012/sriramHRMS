/* =====================================================================
   Unipro Attendance - Masters - MODULE REGISTRATION
   Run after 06_masters_tables.sql. Safe to re-run.
   Registers the new masters as modules and grants Admin full rights.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* Register masters as modules (appear automatically in the rights grid) */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT code, name, ord
FROM (VALUES
    ('DEPARTMENT',  'Department',   8),
    ('DESIGNATION', 'Designation',  9),
    ('EMPLOYEE',    'Employee',     10),
    ('HOLIDAY',     'Holiday',      11),
    ('LEAVETYPE',   'Leave Type',   12),
    ('OFFICE',      'Office',       13)
) AS v(code, name, ord)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = v.code);
GO

/* Grant Admin full rights on any modules it doesn't have yet */
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');

INSERT dbo.tblUserGroupRights (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
SELECT @adminId, m.ModuleId, 1, 1, 1, 1, 1
FROM dbo.tblModules m
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblUserGroupRights r WHERE r.GroupId = @adminId AND r.ModuleId = m.ModuleId);
GO
