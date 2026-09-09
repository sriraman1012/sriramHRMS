/* =====================================================================
   Unipro Attendance - Add supporting-document (PDF/image) attachments to
   New Client Implementation records. Documents are stored as a JSON array
   of { fileName, fileType, fileData(base64) } in DocsJson.
   Run against ATTANDANCE_IMP after 39_implementation_records.sql. Re-runnable.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF COL_LENGTH('dbo.tblImplementation', 'DocsJson') IS NULL
    ALTER TABLE dbo.tblImplementation ADD DocsJson NVARCHAR(MAX) NULL;
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
    @CompletionPercent INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF (@ImplId IS NULL OR @ImplId = 0)
    BEGIN
        INSERT dbo.tblImplementation (ClientName, Address, Phone, ResponsiblePerson, LocationType, Addons, TasksJson, DocsJson, CompletionPercent)
        VALUES (@ClientName, @Address, @Phone, @ResponsiblePerson, @LocationType, @Addons, @TasksJson, @DocsJson, @CompletionPercent);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS ImplId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblImplementation
            SET ClientName = @ClientName, Address = @Address, Phone = @Phone,
                ResponsiblePerson = @ResponsiblePerson, LocationType = @LocationType,
                Addons = @Addons, TasksJson = @TasksJson, DocsJson = @DocsJson,
                CompletionPercent = @CompletionPercent, UpdatedAt = SYSUTCDATETIME()
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
           HasDocs = CASE WHEN DocsJson IS NOT NULL AND LEN(DocsJson) > 2 THEN 1 ELSE 0 END,
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
           Addons, TasksJson, DocsJson, CompletionPercent
    FROM dbo.tblImplementation WHERE ImplId = @ImplId;
END
GO

PRINT 'Implementation document attachments ready.';
GO
