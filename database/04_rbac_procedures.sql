/* =====================================================================
   Unipro Attendance - Module 1: User Management (RBAC) - PROCEDURES
   Run after 03_rbac_seed.sql.  All procs use CREATE OR ALTER (re-runnable).
   Naming: procedures = SP_*
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* =====================  MODULES  ===================== */
CREATE OR ALTER PROCEDURE dbo.SP_Module_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ModuleId, ModuleCode, ModuleName, DisplayOrder, IsActive
    FROM dbo.tblModules
    WHERE IsActive = 1
    ORDER BY DisplayOrder, ModuleName;
END
GO

/* =====================  USER GROUPS  ===================== */
CREATE OR ALTER PROCEDURE dbo.SP_UserGroup_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT GroupId, GroupName, Description, IsActive
    FROM dbo.tblUserGroups
    ORDER BY GroupName;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_UserGroup_Save
    @GroupId     INT           = NULL,   -- NULL / 0 = insert, else update
    @GroupName   NVARCHAR(50),
    @Description NVARCHAR(200) = NULL,
    @IsActive    BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@GroupId IS NULL OR @GroupId = 0)
    BEGIN
        INSERT dbo.tblUserGroups (GroupName, Description, IsActive)
        VALUES (@GroupName, @Description, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS GroupId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblUserGroups
            SET GroupName = @GroupName, Description = @Description, IsActive = @IsActive
        WHERE GroupId = @GroupId;
        SELECT @GroupId AS GroupId;
    END
END
GO

/* =====================  USER RIGHTS (matrix)  ===================== */
-- Returns every active module with this group's rights (0 if not set yet)
CREATE OR ALTER PROCEDURE dbo.SP_UserGroupRights_GetByGroup
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.ModuleId,
        m.ModuleCode,
        m.ModuleName,
        m.DisplayOrder,
        CanView   = ISNULL(r.CanView,   0),
        CanAdd    = ISNULL(r.CanAdd,    0),
        CanEdit   = ISNULL(r.CanEdit,   0),
        CanDelete = ISNULL(r.CanDelete, 0),
        CanExport = ISNULL(r.CanExport, 0)
    FROM dbo.tblModules m
    LEFT JOIN dbo.tblUserGroupRights r
        ON r.ModuleId = m.ModuleId AND r.GroupId = @GroupId
    WHERE m.IsActive = 1
    ORDER BY m.DisplayOrder, m.ModuleName;
END
GO

-- Saves the whole grid for a group. @RightsJson is a JSON array:
-- [{"moduleId":1,"canView":1,"canAdd":1,"canEdit":0,"canDelete":0,"canExport":1}, ...]
CREATE OR ALTER PROCEDURE dbo.SP_UserGroupRights_Save
    @GroupId    INT,
    @RightsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    MERGE dbo.tblUserGroupRights AS t
    USING (
        SELECT ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport
        FROM OPENJSON(@RightsJson)
        WITH (
            ModuleId  INT '$.moduleId',
            CanView   BIT '$.canView',
            CanAdd    BIT '$.canAdd',
            CanEdit   BIT '$.canEdit',
            CanDelete BIT '$.canDelete',
            CanExport BIT '$.canExport'
        )
    ) AS s
    ON t.GroupId = @GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN
        UPDATE SET CanView = s.CanView, CanAdd = s.CanAdd, CanEdit = s.CanEdit,
                   CanDelete = s.CanDelete, CanExport = s.CanExport
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (@GroupId, s.ModuleId, s.CanView, s.CanAdd, s.CanEdit, s.CanDelete, s.CanExport);
END
GO

/* =====================  USERS  ===================== */
CREATE OR ALTER PROCEDURE dbo.SP_User_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.UserId, u.UserCode, u.Username, u.Email, u.Mobile,
           u.Designation, u.IsActive, u.GroupId, g.GroupName
    FROM dbo.Users u
    LEFT JOIN dbo.tblUserGroups g ON g.GroupId = u.GroupId
    ORDER BY u.UserCode;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_User_GetById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.UserId, u.UserCode, u.Username, u.Email, u.Mobile,
           u.Address1, u.Address2, u.Designation, u.IsActive,
           u.GroupId, g.GroupName
    FROM dbo.Users u
    LEFT JOIN dbo.tblUserGroups g ON g.GroupId = u.GroupId
    WHERE u.UserId = @UserId;
END
GO

-- Adds a user and auto-generates UserCode (UNI0001, ...). Returns the new code + id.
CREATE OR ALTER PROCEDURE dbo.SP_User_Add
    @Username     NVARCHAR(50),
    @PasswordHash NVARCHAR(128),
    @Email        NVARCHAR(150) = NULL,
    @Mobile       NVARCHAR(20)  = NULL,
    @Address1     NVARCHAR(200) = NULL,
    @Address2     NVARCHAR(200) = NULL,
    @Designation  NVARCHAR(100) = NULL,
    @GroupId      INT,
    @IsActive     BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @n INT = NEXT VALUE FOR dbo.Seq_UserCode;
    DECLARE @code NVARCHAR(20) = N'UNI' + FORMAT(@n, '0000');

    INSERT dbo.Users (UserCode, Username, PasswordHash, Email, Mobile,
                      Address1, Address2, Designation, GroupId, IsActive, CreatedAt)
    VALUES (@code, @Username, @PasswordHash, @Email, @Mobile,
            @Address1, @Address2, @Designation, @GroupId, @IsActive, SYSUTCDATETIME());

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS UserId, @code AS UserCode;
END
GO

-- Updates a user. Pass @PasswordHash only when changing it (NULL/empty keeps the old one).
CREATE OR ALTER PROCEDURE dbo.SP_User_Update
    @UserId       INT,
    @Username     NVARCHAR(50),
    @Email        NVARCHAR(150) = NULL,
    @Mobile       NVARCHAR(20)  = NULL,
    @Address1     NVARCHAR(200) = NULL,
    @Address2     NVARCHAR(200) = NULL,
    @Designation  NVARCHAR(100) = NULL,
    @GroupId      INT,
    @IsActive     BIT,
    @PasswordHash NVARCHAR(128) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users
        SET Username     = @Username,
            Email        = @Email,
            Mobile       = @Mobile,
            Address1     = @Address1,
            Address2     = @Address2,
            Designation  = @Designation,
            GroupId      = @GroupId,
            IsActive     = @IsActive,
            PasswordHash = CASE WHEN @PasswordHash IS NOT NULL AND LEN(@PasswordHash) > 0
                                THEN @PasswordHash ELSE PasswordHash END,
            UpdatedAt    = SYSUTCDATETIME()
    WHERE UserId = @UserId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_User_SetActive
    @UserId   INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
    WHERE UserId = @UserId;
END
GO

/* =====================  DELETE (mapping-checked)  ===================== */
-- A group can be deleted only when no user is assigned to it. Its own
-- rights rows (the group x module matrix) belong to the group, so they
-- are removed along with it.
CREATE OR ALTER PROCEDURE dbo.SP_UserGroup_Delete
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.Users WHERE GroupId = @GroupId)
    BEGIN
        RAISERROR (N'This group is already mapped to one or more users, so it cannot be deleted.', 16, 1);
        RETURN;
    END
    DELETE FROM dbo.tblUserGroupRights WHERE GroupId = @GroupId;  -- the group's own rights
    DELETE FROM dbo.tblUserGroups      WHERE GroupId = @GroupId;
END
GO

-- Users are not referenced by other tables, so a user can be deleted
-- directly. (The API blocks deleting the account you are logged in as.)
CREATE OR ALTER PROCEDURE dbo.SP_User_Delete
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Users WHERE UserId = @UserId;
END
GO

/* =====================  LOGIN (updated)  ===================== */
-- Now also returns the user's group + id so the API can load rights.
CREATE OR ALTER PROCEDURE dbo.SP_User_GetByUsername
    @Username NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (1)
        u.UserId, u.Username, u.PasswordHash, u.DisplayName, u.Role,
        u.IsActive, u.GroupId, g.GroupName
    FROM dbo.Users u
    LEFT JOIN dbo.tblUserGroups g ON g.GroupId = u.GroupId
    WHERE u.Username = @Username;
END
GO

-- Effective rights for a logged-in user (drives the front-end menu / access).
CREATE OR ALTER PROCEDURE dbo.SP_UserRights_GetByUserId
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT m.ModuleCode, m.ModuleName,
           r.CanView, r.CanAdd, r.CanEdit, r.CanDelete, r.CanExport
    FROM dbo.Users u
    JOIN dbo.tblUserGroupRights r ON r.GroupId = u.GroupId
    JOIN dbo.tblModules m         ON m.ModuleId = r.ModuleId AND m.IsActive = 1
    WHERE u.UserId = @UserId
      AND (r.CanView = 1 OR r.CanAdd = 1 OR r.CanEdit = 1 OR r.CanDelete = 1 OR r.CanExport = 1)
    ORDER BY m.DisplayOrder;
END
GO
