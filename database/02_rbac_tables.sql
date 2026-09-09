/* =====================================================================
   Unipro Attendance - Module 1: User Management (RBAC) - TABLES
   Run against ATTANDANCE_IMP.  Safe to re-run (guarded with IF checks).
   Naming: tables = tbl* , procedures = SP_*
   Creates: tblModules, tblUserGroups, tblUserGroupRights, Seq_UserCode
            + extends existing dbo.Users with master columns
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---------------------------------------------------------------------
   1. tblModules  -  master list of app features (extensible)
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.tblModules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblModules
    (
        ModuleId     INT           IDENTITY(1,1) NOT NULL,
        ModuleCode   NVARCHAR(30)  NOT NULL,
        ModuleName   NVARCHAR(100) NOT NULL,
        DisplayOrder INT           NOT NULL CONSTRAINT DF_tblModules_Order    DEFAULT (0),
        IsActive     BIT           NOT NULL CONSTRAINT DF_tblModules_IsActive DEFAULT (1),
        CONSTRAINT PK_tblModules      PRIMARY KEY (ModuleId),
        CONSTRAINT UQ_tblModules_Code UNIQUE (ModuleCode)
    );
END
GO

/* ---------------------------------------------------------------------
   2. tblUserGroups  -  Admin, HR Team, ...
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.tblUserGroups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblUserGroups
    (
        GroupId     INT           IDENTITY(1,1) NOT NULL,
        GroupName   NVARCHAR(50)  NOT NULL,
        Description NVARCHAR(200) NULL,
        IsActive    BIT           NOT NULL CONSTRAINT DF_tblUserGroups_IsActive  DEFAULT (1),
        CreatedAt   DATETIME2(0)  NOT NULL CONSTRAINT DF_tblUserGroups_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_tblUserGroups      PRIMARY KEY (GroupId),
        CONSTRAINT UQ_tblUserGroups_Name UNIQUE (GroupName)
    );
END
GO

/* ---------------------------------------------------------------------
   3. tblUserGroupRights  -  the tick-box matrix (group x module)
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.tblUserGroupRights', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblUserGroupRights
    (
        RightId   INT IDENTITY(1,1) NOT NULL,
        GroupId   INT NOT NULL,
        ModuleId  INT NOT NULL,
        CanView   BIT NOT NULL CONSTRAINT DF_tblUGR_View   DEFAULT (0),
        CanAdd    BIT NOT NULL CONSTRAINT DF_tblUGR_Add    DEFAULT (0),
        CanEdit   BIT NOT NULL CONSTRAINT DF_tblUGR_Edit   DEFAULT (0),
        CanDelete BIT NOT NULL CONSTRAINT DF_tblUGR_Delete DEFAULT (0),
        CanExport BIT NOT NULL CONSTRAINT DF_tblUGR_Export DEFAULT (0),
        CONSTRAINT PK_tblUserGroupRights PRIMARY KEY (RightId),
        CONSTRAINT FK_tblUGR_Group  FOREIGN KEY (GroupId)  REFERENCES dbo.tblUserGroups(GroupId),
        CONSTRAINT FK_tblUGR_Module FOREIGN KEY (ModuleId) REFERENCES dbo.tblModules(ModuleId),
        CONSTRAINT UQ_tblUGR_GroupModule UNIQUE (GroupId, ModuleId)
    );
END
GO

/* ---------------------------------------------------------------------
   4. Sequence for auto UserCode (UNI0001, UNI0002, ...)
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.Seq_UserCode', N'SO') IS NULL
    CREATE SEQUENCE dbo.Seq_UserCode AS INT START WITH 1 INCREMENT BY 1;
GO

/* ---------------------------------------------------------------------
   5. Extend dbo.Users with the user-master columns
      (keeps existing Username / PasswordHash / DisplayName / Role /
       IsActive / CreatedAt used by login)
   --------------------------------------------------------------------- */
IF COL_LENGTH('dbo.Users', 'UserCode')    IS NULL ALTER TABLE dbo.Users ADD UserCode    NVARCHAR(20)  NULL;
IF COL_LENGTH('dbo.Users', 'Email')       IS NULL ALTER TABLE dbo.Users ADD Email       NVARCHAR(150) NULL;
IF COL_LENGTH('dbo.Users', 'Mobile')      IS NULL ALTER TABLE dbo.Users ADD Mobile      NVARCHAR(20)  NULL;
IF COL_LENGTH('dbo.Users', 'Address1')    IS NULL ALTER TABLE dbo.Users ADD Address1    NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.Users', 'Address2')    IS NULL ALTER TABLE dbo.Users ADD Address2    NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.Users', 'Designation') IS NULL ALTER TABLE dbo.Users ADD Designation NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Users', 'GroupId')     IS NULL ALTER TABLE dbo.Users ADD GroupId     INT           NULL;
IF COL_LENGTH('dbo.Users', 'UpdatedAt')   IS NULL ALTER TABLE dbo.Users ADD UpdatedAt   DATETIME2(0)  NULL;
GO

/* FK Users -> tblUserGroups */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Users_Group')
    ALTER TABLE dbo.Users ADD CONSTRAINT FK_Users_Group FOREIGN KEY (GroupId) REFERENCES dbo.tblUserGroups(GroupId);
GO

/* Unique UserCode (filtered so existing NULLs before back-fill are allowed) */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Users_UserCode' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE UNIQUE INDEX UQ_Users_UserCode ON dbo.Users(UserCode) WHERE UserCode IS NOT NULL;
GO
