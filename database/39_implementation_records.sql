/* =====================================================================
   Unipro Attendance - New Client Implementation RECORDS
   Persists each client's implementation (header + checklist tasks as JSON
   + selected add-ons). Powers the summary list and the click-to-open form.
   Uses the existing 'implementation' RBAC module. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblImplementation', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblImplementation
    (
        ImplId            INT            IDENTITY(1,1) NOT NULL,
        ClientName        NVARCHAR(200)  NOT NULL,
        Address           NVARCHAR(500)  NULL,
        Phone             NVARCHAR(50)   NULL,
        ResponsiblePerson NVARCHAR(150)  NULL,
        LocationType      NVARCHAR(20)   NOT NULL CONSTRAINT DF_Impl_Loc DEFAULT ('single'),
        Addons            NVARCHAR(300)  NULL,   -- comma-separated add-on names
        TasksJson         NVARCHAR(MAX)  NULL,   -- [{taskName,status,remarks,sortOrder}, ...]
        CompletionPercent INT            NOT NULL CONSTRAINT DF_Impl_Pct DEFAULT (0),
        CreatedAt         DATETIME2(0)   NOT NULL CONSTRAINT DF_Impl_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedAt         DATETIME2(0)   NULL,
        CONSTRAINT PK_tblImplementation PRIMARY KEY (ImplId)
    );
END
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
    @CompletionPercent INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF (@ImplId IS NULL OR @ImplId = 0)
    BEGIN
        INSERT dbo.tblImplementation (ClientName, Address, Phone, ResponsiblePerson, LocationType, Addons, TasksJson, CompletionPercent)
        VALUES (@ClientName, @Address, @Phone, @ResponsiblePerson, @LocationType, @Addons, @TasksJson, @CompletionPercent);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS ImplId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblImplementation
            SET ClientName = @ClientName, Address = @Address, Phone = @Phone,
                ResponsiblePerson = @ResponsiblePerson, LocationType = @LocationType,
                Addons = @Addons, TasksJson = @TasksJson, CompletionPercent = @CompletionPercent,
                UpdatedAt = SYSUTCDATETIME()
        WHERE ImplId = @ImplId;
        SELECT @ImplId AS ImplId;
    END
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Implementation_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ImplId, ClientName, Phone, ResponsiblePerson, LocationType, Addons, CompletionPercent,
           SavedAt = ISNULL(UpdatedAt, CreatedAt)
    FROM dbo.tblImplementation
    ORDER BY ISNULL(UpdatedAt, CreatedAt) DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Implementation_GetById
    @ImplId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ImplId, ClientName, Address, Phone, ResponsiblePerson, LocationType,
           Addons, TasksJson, CompletionPercent
    FROM dbo.tblImplementation WHERE ImplId = @ImplId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Implementation_Delete
    @ImplId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblImplementation WHERE ImplId = @ImplId;
END
GO

PRINT 'Implementation records ready.';
GO
