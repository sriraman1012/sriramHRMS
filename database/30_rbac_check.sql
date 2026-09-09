/* =====================================================================
   Unipro Attendance - Server-side rights check (defense in depth)
   Returns one module's effective flags for a user (Admin => all 1).
   Used by the API to reject unauthorized writes even if the UI is bypassed.
   Run against ATTANDANCE_IMP after 29_rbac_modules.sql. Re-runnable.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

CREATE OR ALTER PROCEDURE dbo.SP_UserRights_Check
    @Username   NVARCHAR(50),
    @ModuleCode NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @gid INT = (SELECT TOP 1 GroupId FROM dbo.Users WHERE Username = @Username);
    DECLARE @isAdmin BIT = CASE WHEN EXISTS (SELECT 1 FROM dbo.tblUserGroups WHERE GroupId = @gid AND GroupName = N'Admin') THEN 1 ELSE 0 END;

    SELECT TOP 1
        CanView   = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanView,   0) END,
        CanAdd    = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanAdd,    0) END,
        CanEdit   = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanEdit,   0) END,
        CanDelete = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanDelete, 0) END,
        CanExport = CASE WHEN @isAdmin = 1 THEN 1 ELSE ISNULL(r.CanExport, 0) END
    FROM dbo.tblModules m
    LEFT JOIN dbo.tblUserGroupRights r ON r.ModuleId = m.ModuleId AND r.GroupId = @gid
    WHERE m.ModuleCode = @ModuleCode;
END
GO
