/* =====================================================================
   Unipro Attendance - RBAC modules refresh + effective-rights lookup
   - Retires the old coarse modules and seeds one module per real page
     (ModuleCode == the frontend nav key, so rights map 1:1).
   - Admin group gets full rights on everything.
   - SP_UserRights_GetForUser returns a user's effective rights (Admin => all).
   Run against ATTANDANCE_IMP after 03_rbac_seed.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* Retire the old, coarse modules so they no longer show in the matrix. */
UPDATE dbo.tblModules SET IsActive = 0
WHERE ModuleCode IN ('ATT', 'SUMMARY', 'LEAVE', 'TEAM', 'USERGROUP', 'USERRIGHTS',
                     'AttendanceEntry', 'attendanceentry');  -- retire strays / old codes
GO

/* One module per page. ModuleCode = the app's nav key. */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT code, name, ord
FROM (VALUES
    ('home',              'Dashboard',                1),
    ('groups',            'User Groups',              2),
    ('rights',            'User Rights',              3),
    ('users',             'Users',                    4),
    ('employee',          'Employee',                 5),
    ('department',        'Department',               6),
    ('designation',       'Designation',              7),
    ('holiday',           'Holiday',                  8),
    ('leavetype',         'Leave Type',               9),
    ('office',            'Office',                   10),
    ('weekly-off',        'Weekly Off',               11),
    ('chat',              'Chat Messages',            12),
    ('att-entry',         'Attendance Entry',         13),
    ('leave-register',    'Leave Register',           14),
    ('hourly-permission', 'Hourly Permission',        15),
    ('balance-cf',        'Balance Carry Forward',    16),
    ('happy-hours',       'Happy Hours',              17),
    ('rpt-summary',       'Employee Summary Report',  18),
    ('rpt-detail',        'Attendance Detail Report', 19),
    ('rpt-leave',         'Leave Report',             20),
    ('rpt-permission',    'Permission Report',        21),
    ('rpt-onsite',        'Onsite Report',            22),
    ('rpt-happy-hours',   'Happy Hours Report',       23),
    ('settings',          'Settings',                 24)
) AS v(code, name, ord)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = v.code);
GO

/* Make sure any previously-retired code that is re-listed is active again. */
UPDATE dbo.tblModules SET IsActive = 1
WHERE ModuleCode IN ('home','groups','rights','users','employee','department','designation','holiday',
                     'leavetype','office','weekly-off','chat','att-entry','leave-register','hourly-permission',
                     'balance-cf','happy-hours','rpt-summary','rpt-detail','rpt-leave','rpt-permission',
                     'rpt-onsite','rpt-happy-hours','settings');
GO

/* Admin group: full rights on every active module. */
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
IF @adminId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, ModuleId FROM dbo.tblModules WHERE IsActive = 1) AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO

/* Effective rights for a logged-in user. The Admin group always gets full rights. */
CREATE OR ALTER PROCEDURE dbo.SP_UserRights_GetForUser
    @Username NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @gid INT = (SELECT TOP 1 GroupId FROM dbo.Users WHERE Username = @Username);
    DECLARE @isAdmin BIT = CASE WHEN EXISTS (SELECT 1 FROM dbo.tblUserGroups WHERE GroupId = @gid AND GroupName = N'Admin') THEN 1 ELSE 0 END;

    SELECT m.ModuleCode,
           CanView   = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanView,   0) END,
           CanAdd    = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanAdd,    0) END,
           CanEdit   = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanEdit,   0) END,
           CanDelete = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanDelete, 0) END,
           CanExport = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanExport, 0) END
    FROM dbo.tblModules m
    LEFT JOIN dbo.tblUserGroupRights r ON r.ModuleId = m.ModuleId AND r.GroupId = @gid
    WHERE m.IsActive = 1;
END
GO
