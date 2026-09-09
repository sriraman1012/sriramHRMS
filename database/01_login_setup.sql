/* =====================================================================
   Unipro Attendance - Login setup
   Run this against the UniproAttendance database.
   Creates: Users table, seed admin user, usp_User_GetByUsername
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---------------------------------------------------------------------
   1. Users table
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserId       INT            IDENTITY(1,1) NOT NULL,
        Username     NVARCHAR(50)   NOT NULL,
        PasswordHash NVARCHAR(128)  NOT NULL,   -- SHA-256 hex (64 chars)
        DisplayName  NVARCHAR(100)  NULL,
        Role         NVARCHAR(20)   NOT NULL CONSTRAINT DF_Users_Role      DEFAULT (N'admin'),
        IsActive     BIT            NOT NULL CONSTRAINT DF_Users_IsActive  DEFAULT (1),
        CreatedAt    DATETIME2(0)   NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Users        PRIMARY KEY (UserId),
        CONSTRAINT UQ_Users_Username UNIQUE (Username)
    );
END
GO

/* ---------------------------------------------------------------------
   2. Seed admin user  ->  sriram / sri@123
      PasswordHash below = SHA-256 hex of 'sri@123'
   --------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = N'sriram')
BEGIN
    INSERT dbo.Users (Username, PasswordHash, DisplayName, Role, IsActive)
    VALUES (N'sriram',
            N'04e85291794fe7ae7c1e640ec03ede27c9300b09c91d91f45d8231b0fee7c0c3',
            N'Sriram', N'admin', 1);
END
GO

/* ---------------------------------------------------------------------
   3. Login lookup stored procedure
      Returns the user row for the API to verify the password hash.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.usp_User_GetByUsername', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_User_GetByUsername;   -- remove old-naming proc if present
GO

CREATE OR ALTER PROCEDURE dbo.SP_User_GetByUsername
    @Username NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (1)
        UserId,
        Username,
        PasswordHash,
        DisplayName,
        Role,
        IsActive
    FROM dbo.Users
    WHERE Username = @Username;
END
GO
