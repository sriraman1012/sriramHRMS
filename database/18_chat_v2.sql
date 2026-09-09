/* =====================================================================
   Unipro Attendance - Chat v2 : reply, edit, delete, nicknames, storage
   Run after 17_chat.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF COL_LENGTH('dbo.tblChatMessage', 'ReplyToId') IS NULL ALTER TABLE dbo.tblChatMessage ADD ReplyToId INT NULL;
IF COL_LENGTH('dbo.tblChatMessage', 'EditedAt')  IS NULL ALTER TABLE dbo.tblChatMessage ADD EditedAt  DATETIME2(0) NULL;
IF COL_LENGTH('dbo.tblChatMessage', 'IsDeleted') IS NULL ALTER TABLE dbo.tblChatMessage ADD IsDeleted BIT NOT NULL CONSTRAINT DF_Chat_Del DEFAULT (0);
GO

IF OBJECT_ID(N'dbo.tblChatNickname', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblChatNickname
    (
        MeId     INT NOT NULL,
        OtherId  INT NOT NULL,
        Nickname NVARCHAR(60) NULL,
        CONSTRAINT PK_tblChatNickname PRIMARY KEY (MeId, OtherId)
    );
END
GO

/* ---- Contacts (adds Nickname; handles deleted last message) ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Contacts
    @MeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId, u.UserCode, u.Username, u.About, u.ProfilePic, u.LastSeen,
        Nickname = (SELECT Nickname FROM dbo.tblChatNickname n WHERE n.MeId = @MeId AND n.OtherId = u.UserId),
        IsOnline = CASE WHEN u.LastSeen >= DATEADD(SECOND, -65, SYSUTCDATETIME()) THEN 1 ELSE 0 END,
        LastMessage = CASE
            WHEN lm.IsDeleted = 1 THEN N'🚫 This message was deleted'
            WHEN lm.FileData IS NOT NULL AND (lm.Body IS NULL OR lm.Body = N'') THEN N'📎 ' + ISNULL(lm.FileName, N'Attachment')
            ELSE lm.Body END,
        LastAt = lm.SentAt,
        Unread = (SELECT COUNT(*) FROM dbo.tblChatMessage m
                  WHERE m.SenderId = u.UserId AND m.ReceiverId = @MeId AND m.ReadAt IS NULL AND m.IsDeleted = 0)
    FROM dbo.Users u
    OUTER APPLY (
        SELECT TOP 1 m.Body, m.FileData, m.FileName, m.SentAt, m.IsDeleted
        FROM dbo.tblChatMessage m
        WHERE (m.SenderId = @MeId AND m.ReceiverId = u.UserId)
           OR (m.SenderId = u.UserId AND m.ReceiverId = @MeId)
        ORDER BY m.SentAt DESC
    ) lm
    WHERE u.UserId <> @MeId AND u.IsActive = 1
    ORDER BY CASE WHEN lm.SentAt IS NULL THEN 1 ELSE 0 END, lm.SentAt DESC, u.Username;
END
GO

/* ---- Conversation (adds reply preview, edited & deleted flags) ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Conversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.MessageId, m.SenderId, m.ReceiverId,
        Body     = CASE WHEN m.IsDeleted = 1 THEN NULL ELSE m.Body END,
        FileData = CASE WHEN m.IsDeleted = 1 THEN NULL ELSE m.FileData END,
        FileName = CASE WHEN m.IsDeleted = 1 THEN NULL ELSE m.FileName END,
        m.FileType, m.SentAt, m.DeliveredAt, m.ReadAt, m.EditedAt, m.IsDeleted, m.ReplyToId,
        Mine = CASE WHEN m.SenderId = @MeId THEN 1 ELSE 0 END,
        ReplyBody = CASE
            WHEN r.MessageId IS NULL THEN NULL
            WHEN r.IsDeleted = 1 THEN N'This message was deleted'
            WHEN r.FileData IS NOT NULL AND (r.Body IS NULL OR r.Body = N'') THEN N'📎 ' + ISNULL(r.FileName, N'Attachment')
            ELSE r.Body END,
        ReplyMine = CASE WHEN r.SenderId = @MeId THEN 1 ELSE 0 END
    FROM dbo.tblChatMessage m
    LEFT JOIN dbo.tblChatMessage r ON r.MessageId = m.ReplyToId
    WHERE (m.SenderId = @MeId AND m.ReceiverId = @OtherId) OR (m.SenderId = @OtherId AND m.ReceiverId = @MeId)
    ORDER BY m.SentAt;
END
GO

/* ---- Send (adds @ReplyToId) ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Send
    @SenderId INT, @ReceiverId INT,
    @Body NVARCHAR(MAX) = NULL, @FileData NVARCHAR(MAX) = NULL,
    @FileName NVARCHAR(200) = NULL, @FileType NVARCHAR(100) = NULL,
    @ReplyToId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT dbo.tblChatMessage (SenderId, ReceiverId, Body, FileData, FileName, FileType, ReplyToId)
    VALUES (@SenderId, @ReceiverId, @Body, @FileData, @FileName, @FileType, @ReplyToId);
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS MessageId, SYSUTCDATETIME() AS SentAt;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Chat_EditMessage
    @MeId INT, @MessageId INT, @Body NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblChatMessage SET Body = @Body, EditedAt = SYSUTCDATETIME()
    WHERE MessageId = @MessageId AND SenderId = @MeId AND IsDeleted = 0;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Chat_DeleteMessage
    @MeId INT, @MessageId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblChatMessage SET IsDeleted = 1, Body = NULL, FileData = NULL, FileName = NULL
    WHERE MessageId = @MessageId AND SenderId = @MeId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Chat_ClearConversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblChatMessage
    WHERE (SenderId = @MeId AND ReceiverId = @OtherId) OR (SenderId = @OtherId AND ReceiverId = @MeId);
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Chat_SetNickname
    @MeId INT, @OtherId INT, @Nickname NVARCHAR(60) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    MERGE dbo.tblChatNickname AS t
    USING (SELECT @MeId AS MeId, @OtherId AS OtherId) AS s
    ON t.MeId = s.MeId AND t.OtherId = s.OtherId
    WHEN MATCHED THEN UPDATE SET Nickname = @Nickname
    WHEN NOT MATCHED THEN INSERT (MeId, OtherId, Nickname) VALUES (@MeId, @OtherId, @Nickname);
END
GO

/* ---- Storage analysis: per-contact message count + bytes ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Storage
    @MeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.UserId, u.Username,
        Messages = COUNT(m.MessageId),
        Bytes = ISNULL(SUM(CAST(DATALENGTH(ISNULL(m.Body, N'')) AS BIGINT) + DATALENGTH(ISNULL(m.FileData, N''))), 0)
    FROM dbo.Users u
    LEFT JOIN dbo.tblChatMessage m
        ON (m.SenderId = @MeId AND m.ReceiverId = u.UserId) OR (m.SenderId = u.UserId AND m.ReceiverId = @MeId)
    WHERE u.UserId <> @MeId AND u.IsActive = 1
    GROUP BY u.UserId, u.Username
    HAVING COUNT(m.MessageId) > 0
    ORDER BY Bytes DESC;
END
GO
