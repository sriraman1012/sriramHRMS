/* =====================================================================
   Unipro Attendance - Chat message reactions (WhatsApp-style emoji badge)
   - tblChatReaction: one reaction per user per message (toggle on/off).
   - SP_Chat_React toggles/updates a reaction.
   - SP_Chat_Conversation now returns a Reactions string per message.
   Run against ATTANDANCE_IMP after 20_chat_storage.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblChatReaction', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblChatReaction (
        ReactionId INT IDENTITY(1,1) PRIMARY KEY,
        MessageId  INT NOT NULL,
        UserId     INT NOT NULL,
        Emoji      NVARCHAR(20) NOT NULL,
        ReactedAt  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ChatReaction UNIQUE (MessageId, UserId),
        CONSTRAINT FK_ChatReaction_Msg FOREIGN KEY (MessageId) REFERENCES dbo.tblChatMessage(MessageId) ON DELETE CASCADE
    );
END
GO

/* Add / change / toggle-off a reaction for the current user on a message. */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_React
    @MeId INT, @MessageId INT, @Emoji NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.tblChatReaction WHERE MessageId = @MessageId AND UserId = @MeId AND Emoji = @Emoji)
        DELETE FROM dbo.tblChatReaction WHERE MessageId = @MessageId AND UserId = @MeId;  -- same emoji again = remove
    ELSE
        MERGE dbo.tblChatReaction AS t
        USING (SELECT @MessageId AS MessageId, @MeId AS UserId) AS s
        ON t.MessageId = s.MessageId AND t.UserId = s.UserId
        WHEN MATCHED THEN UPDATE SET Emoji = @Emoji, ReactedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (MessageId, UserId, Emoji) VALUES (@MessageId, @MeId, @Emoji);
END
GO

/* Conversation query — now includes a space-separated Reactions string per message. */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Conversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ClearedAt DATETIME2(0) = (SELECT ClearedAt FROM dbo.tblChatNickname WHERE MeId = @MeId AND OtherId = @OtherId);
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
        ReplyMine = CASE WHEN r.SenderId = @MeId THEN 1 ELSE 0 END,
        Reactions = (SELECT STRING_AGG(rx.Emoji, N' ') FROM dbo.tblChatReaction rx WHERE rx.MessageId = m.MessageId)
    FROM dbo.tblChatMessage m
    LEFT JOIN dbo.tblChatMessage r ON r.MessageId = m.ReplyToId
    WHERE ((m.SenderId = @MeId AND m.ReceiverId = @OtherId) OR (m.SenderId = @OtherId AND m.ReceiverId = @MeId))
      AND m.SentAt > ISNULL(@ClearedAt, '19000101')
    ORDER BY m.SentAt;
END
GO
