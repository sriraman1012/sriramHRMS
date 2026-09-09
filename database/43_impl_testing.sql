/* =====================================================================
   Unipro Attendance - Process Testing for New Client Implementation.
   - Master of testing items grouped Backoffice / POS (managed in the
     Implementation Checklist master, a tab).
   - Testing results stored per implementation record in TestingJson.
   Run against ATTANDANCE_IMP after 42_implementation_docs.sql. Re-runnable.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---- Testing master ---- */
IF OBJECT_ID(N'dbo.tblImplTestItem', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblImplTestItem
    (
        TestId       INT           IDENTITY(1,1) NOT NULL,
        TestName     NVARCHAR(200) NOT NULL,
        TestGroup    NVARCHAR(30)  NOT NULL CONSTRAINT DF_ImplTest_Group DEFAULT ('Backoffice'), -- 'Backoffice' | 'POS'
        DisplayOrder INT           NOT NULL CONSTRAINT DF_ImplTest_Order  DEFAULT (0),
        IsActive     BIT           NOT NULL CONSTRAINT DF_ImplTest_Active DEFAULT (1),
        CreatedAt    DATETIME2(0)  NOT NULL CONSTRAINT DF_ImplTest_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedAt    DATETIME2(0)  NULL,
        CONSTRAINT PK_tblImplTestItem PRIMARY KEY (TestId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tblImplTestItem)
BEGIN
    INSERT dbo.tblImplTestItem (TestName, TestGroup, DisplayOrder)
    VALUES
        -- Backoffice
        (N'Change Company Master / GST Details', N'Backoffice', 1),
        (N'Create Inventory Masters',            N'Backoffice', 2),
        (N'Create PO / Auto PO',                 N'Backoffice', 3),
        (N'GRN Process',                         N'Backoffice', 4),
        (N'Check and Take Barcode Print',        N'Backoffice', 5),
        (N'Purchase Return',                     N'Backoffice', 6),
        (N'Stock Adjustment',                    N'Backoffice', 7),
        (N'Stock Update',                        N'Backoffice', 8),
        -- POS
        (N'Normal Bills',                                 N'POS', 9),
        (N'Multi Paymode',                                N'POS', 10),
        (N'Crystal Reports & Bill Value Checking',        N'POS', 11),
        (N'Bill Refund by Cash',                          N'POS', 12),
        (N'Bill Refund with Credit Note',                 N'POS', 13),
        (N'Trade-in Bill / Adjustment',                   N'POS', 14),
        (N'Estimation Bill & Estimation Against Bill',    N'POS', 15),
        (N'Settlement',                                   N'POS', 16),
        (N'HOLD / Bill View',                             N'POS', 17);
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_ImplTest_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TestId, TestName, TestGroup, DisplayOrder, IsActive
    FROM dbo.tblImplTestItem ORDER BY DisplayOrder, TestName;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_ImplTest_Save
    @TestId       INT = NULL,
    @TestName     NVARCHAR(200),
    @TestGroup    NVARCHAR(30) = 'Backoffice',
    @DisplayOrder INT = 0,
    @IsActive     BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF (@TestId IS NULL OR @TestId = 0)
    BEGIN
        IF (@DisplayOrder = 0)
            SET @DisplayOrder = ISNULL((SELECT MAX(DisplayOrder) FROM dbo.tblImplTestItem), 0) + 1;
        INSERT dbo.tblImplTestItem (TestName, TestGroup, DisplayOrder, IsActive)
        VALUES (@TestName, @TestGroup, @DisplayOrder, @IsActive);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS TestId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblImplTestItem
            SET TestName = @TestName, TestGroup = @TestGroup, DisplayOrder = @DisplayOrder,
                IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME()
        WHERE TestId = @TestId;
        SELECT @TestId AS TestId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_ImplTest_SetActive
    @TestId INT, @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblImplTestItem SET IsActive = @IsActive, UpdatedAt = SYSUTCDATETIME() WHERE TestId = @TestId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_ImplTest_Delete
    @TestId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblImplTestItem WHERE TestId = @TestId;
END
GO

/* ---- Add TestingJson to the implementation record + refresh save/get ---- */
IF COL_LENGTH('dbo.tblImplementation', 'TestingJson') IS NULL
    ALTER TABLE dbo.tblImplementation ADD TestingJson NVARCHAR(MAX) NULL;
GO

CREATE OR ALTER PROCEDURE dbo.SP_Implementation_Save
    @ImplId            INT = NULL,
    @ClientName        NVARCHAR(200),
    @Address           NVARCHAR(500) = NULL,
    @Phone             NVARCHAR(50)  = NULL,
    @ResponsiblePerson NVARCHAR(150) = NULL,
    @LocationType      NVARCHAR(20)  = 'single',
    @Addons            NVARCHAR(300) = NULL,
    @TasksJson         NVARCHAR(MAX) = NULL,
    @DocsJson          NVARCHAR(MAX) = NULL,
    @TestingJson       NVARCHAR(MAX) = NULL,
    @CompletionPercent INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF (@ImplId IS NULL OR @ImplId = 0)
    BEGIN
        INSERT dbo.tblImplementation (ClientName, Address, Phone, ResponsiblePerson, LocationType, Addons, TasksJson, DocsJson, TestingJson, CompletionPercent)
        VALUES (@ClientName, @Address, @Phone, @ResponsiblePerson, @LocationType, @Addons, @TasksJson, @DocsJson, @TestingJson, @CompletionPercent);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS ImplId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblImplementation
            SET ClientName = @ClientName, Address = @Address, Phone = @Phone,
                ResponsiblePerson = @ResponsiblePerson, LocationType = @LocationType,
                Addons = @Addons, TasksJson = @TasksJson, DocsJson = @DocsJson,
                TestingJson = @TestingJson, CompletionPercent = @CompletionPercent, UpdatedAt = SYSUTCDATETIME()
        WHERE ImplId = @ImplId;
        SELECT @ImplId AS ImplId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Implementation_GetById
    @ImplId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ImplId, ClientName, Address, Phone, ResponsiblePerson, LocationType,
           Addons, TasksJson, DocsJson, TestingJson, CompletionPercent
    FROM dbo.tblImplementation WHERE ImplId = @ImplId;
END
GO

PRINT 'Process Testing ready.';
GO
