/* =====================================================================
   Unipro Attendance - Module 1: User Management (RBAC) - VIEWS
   Run after 04_rbac_procedures.sql.  Re-runnable (CREATE OR ALTER).
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* Flat user list with group name (handy for grids / reporting) */
CREATE OR ALTER VIEW dbo.vw_UserList
AS
    SELECT u.UserId, u.UserCode, u.Username, u.Email, u.Mobile,
           u.Designation, u.IsActive, u.GroupId, g.GroupName
    FROM dbo.Users u
    LEFT JOIN dbo.tblUserGroups g ON g.GroupId = u.GroupId;
GO

/* Group rights spelled out with module + group names */
CREATE OR ALTER VIEW dbo.vw_GroupRights
AS
    SELECT g.GroupId, g.GroupName, m.ModuleId, m.ModuleCode, m.ModuleName,
           r.CanView, r.CanAdd, r.CanEdit, r.CanDelete, r.CanExport
    FROM dbo.tblUserGroupRights r
    JOIN dbo.tblUserGroups g ON g.GroupId = r.GroupId
    JOIN dbo.tblModules    m ON m.ModuleId = r.ModuleId;
GO
