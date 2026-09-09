/* =====================================================================
   Unipro Attendance - Chat Delete Log (audit of chat deletions)
   - New table dbo.tblChatDeleteLog records every chat delete action:
       'message' (single soft-delete), 'clear' (one-sided hide), 'purge'
       (hard delete of a whole conversation).
   - The three delete SPs now write an audit row BEFORE destroying data.
   - SP_ChatDeleteLog_GetAll powers the new "Chat Delete Log" report.
   - Seeds the RBAC module 'rpt-chat-delete' and grants Admin full rights.
   Run against ATTANDANCE_IMP after 30_rbac_check.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---------- Audit table ---------- */
IF OBJECT_ID(N'dbo.tblChatDeleteLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblChatDeleteLog (
        LogId        INT IDENTITY(1,1) PRIMARY KEY,
        DeleteType   NVARCHAR(20)  NOT NULL,             -- 'message' | 'clear' | 'purge'
        ActorUserId  INT           NOT NULL,             -- who performed the delete
        OtherUserId  INT           NULL,                 -- the other party (clear/purge)
        MessageId    INT           NULL,                 -- single message delete
        SenderId     INT           NULL,
        ReceiverId   INT           NULL,
        BodySnapshot NVARCHAR(MAX) NULL,                 -- captured text (single message)
        FileName     NVARCHAR(200) NULL,
        MessageCount INT           NULL,                 -- rows affected (clear/purge)
        SentAt       DATETIME2(0)  NULL,                 -- original message time (single)
        DeletedAt    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

/* ---------- a) Single message: SOFT delete + log ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_DeleteMessage
    @MeId INT, @MessageId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Capture the message content before we null it out (only the sender may delete).
    INSERT dbo.tblChatDeleteLog (DeleteType, ActorUserId, OtherUserId, MessageId, SenderId, ReceiverId, BodySnapshot, FileName, MessageCount, SentAt)
    SELECT 'message', @MeId, ReceiverId, MessageId, SenderId, ReceiverId, Body, FileName, 1, SentAt
    FROM dbo.tblChatMessage
    WHERE MessageId = @MessageId AND SenderId = @MeId AND IsDeleted = 0;

    UPDATE dbo.tblChatMessage
    SET IsDeleted = 1, Body = NULL, FileData = NULL, FileName = NULL
    WHERE MessageId = @MessageId AND SenderId = @MeId;
END
GO

/* ---------- b) Clear conversation: one-sided hide + log ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_ClearConversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Log how many messages this clear hides for the actor.
    INSERT dbo.tblChatDeleteLog (DeleteType, ActorUserId, OtherUserId, MessageCount)
    SELECT 'clear', @MeId, @OtherId, COUNT(*)
    FROM dbo.tblChatMessage
    WHERE (SenderId = @MeId AND ReceiverId = @OtherId) OR (SenderId = @OtherId AND ReceiverId = @MeId);

    MERGE dbo.tblChatNickname AS t
    USING (SELECT @MeId AS MeId, @OtherId AS OtherId) AS s
    ON t.MeId = s.MeId AND t.OtherId = s.OtherId
    WHEN MATCHED THEN UPDATE SET ClearedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN INSERT (MeId, OtherId, ClearedAt) VALUES (@MeId, @OtherId, SYSUTCDATETIME());
END
GO

/* ---------- c) Purge conversation: HARD delete (both sides) + log ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_PurgeConversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Snapshot the count before the rows are gone forever.
    INSERT dbo.tblChatDeleteLog (DeleteType, ActorUserId, OtherUserId, MessageCount)
    SELECT 'purge', @MeId, @OtherId, COUNT(*)
    FROM dbo.tblChatMessage
    WHERE (SenderId = @MeId AND ReceiverId = @OtherId) OR (SenderId = @OtherId AND ReceiverId = @MeId);

    DELETE FROM dbo.tblChatMessage
    WHERE (SenderId = @MeId AND ReceiverId = @OtherId) OR (SenderId = @OtherId AND ReceiverId = @MeId);

    UPDATE dbo.tblChatNickname SET ClearedAt = NULL WHERE MeId = @MeId AND OtherId = @OtherId;
END
GO

/* ---------- Read SP for the report ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_ChatDeleteLog_GetAll
    @From DATE = NULL, @To DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        l.LogId, l.DeleteType, l.DeletedAt,
        l.ActorUserId, ActorName = au.Username,
        l.OtherUserId, OtherName = ou.Username,
        l.MessageId,
        l.SenderId,   SenderName   = su.Username,
        l.ReceiverId, ReceiverName = ru.Username,
        l.BodySnapshot, l.FileName, l.MessageCount, l.SentAt
    FROM dbo.tblChatDeleteLog l
    LEFT JOIN dbo.Users au ON au.UserId = l.ActorUserId
    LEFT JOIN dbo.Users ou ON ou.UserId = l.OtherUserId
    LEFT JOIN dbo.Users su ON su.UserId = l.SenderId
    LEFT JOIN dbo.Users ru ON ru.UserId = l.ReceiverId
    WHERE (@From IS NULL OR CAST(l.DeletedAt AS DATE) >= @From)
      AND (@To   IS NULL OR CAST(l.DeletedAt AS DATE) <= @To)
    ORDER BY l.DeletedAt DESC, l.LogId DESC;
END
GO

/* ---------- RBAC: register the report as a module ---------- */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT 'rpt-chat-delete', 'Chat Delete Log', 25
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = 'rpt-chat-delete');
GO

UPDATE dbo.tblModules SET IsActive = 1 WHERE ModuleCode = 'rpt-chat-delete';
GO

/* Admin group: grant full rights on the new module. */
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
IF @adminId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, ModuleId FROM dbo.tblModules WHERE ModuleCode = 'rpt-chat-delete') AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO
