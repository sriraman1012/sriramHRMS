/* =====================================================================
   Unipro Attendance - Attendance Entry - MODULE REGISTRATION
   Run after 09_attendance_tables.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT code, name, ord
FROM (VALUES ('ATTENDANCEENTRY', 'Attendance Entry', 14)) AS v(code, name, ord)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = v.code);
GO

DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
INSERT dbo.tblUserGroupRights (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
SELECT @adminId, m.ModuleId, 1, 1, 1, 1, 1
FROM dbo.tblModules m
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblUserGroupRights r WHERE r.GroupId = @adminId AND r.ModuleId = m.ModuleId);
GO
