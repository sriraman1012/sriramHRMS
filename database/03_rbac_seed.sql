/* =====================================================================
   Unipro Attendance - Module 1: User Management (RBAC) - SEED DATA
   Run after 02_rbac_tables.sql.  Safe to re-run.
   Seeds: modules, Admin + HR Team groups, Admin full rights,
          and upgrades the existing 'sriram' login into the user master.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---- Modules (only inserts the ones not already present) ---- */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT code, name, ord
FROM (VALUES
    ('ATT',        'Attendance',       1),
    ('SUMMARY',    'Monthly Summary',  2),
    ('LEAVE',      'Leave Register',   3),
    ('TEAM',       'Team & Holidays',  4),
    ('USERGROUP',  'User Groups',      5),
    ('USERRIGHTS', 'User Rights',      6),
    ('USERS',      'Users',            7)
) AS v(code, name, ord)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = v.code);
GO

/* ---- Groups ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.tblUserGroups WHERE GroupName = N'Admin')
    INSERT dbo.tblUserGroups (GroupName, Description) VALUES (N'Admin', N'Full system administrator');

IF NOT EXISTS (SELECT 1 FROM dbo.tblUserGroups WHERE GroupName = N'HR Team')
    INSERT dbo.tblUserGroups (GroupName, Description) VALUES (N'HR Team', N'HR staff');
GO

/* ---- Admin group gets full rights on every module ---- */
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');

INSERT dbo.tblUserGroupRights (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
SELECT @adminId, m.ModuleId, 1, 1, 1, 1, 1
FROM dbo.tblModules m
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblUserGroupRights r WHERE r.GroupId = @adminId AND r.ModuleId = m.ModuleId);
GO

/* ---- Upgrade existing 'sriram' login into the user master ---- */
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');

IF EXISTS (SELECT 1 FROM dbo.Users WHERE Username = N'sriram' AND UserCode IS NULL)
BEGIN
    DECLARE @n INT = NEXT VALUE FOR dbo.Seq_UserCode;
    UPDATE dbo.Users
        SET UserCode    = N'UNI' + FORMAT(@n, '0000'),
            GroupId     = @adminId,
            Designation = ISNULL(Designation, N'Administrator'),
            UpdatedAt   = SYSUTCDATETIME()
    WHERE Username = N'sriram';
END
GO
