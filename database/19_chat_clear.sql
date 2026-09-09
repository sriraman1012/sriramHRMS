/* =====================================================================
   Unipro Attendance - Chat: one-sided "Clear chat"
   Clearing a chat now only hides messages for the user who cleared it
   (a per-user ClearedAt marker) - the other side keeps their messages.
   Run after 18_chat_v2.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF COL_LENGTH('dbo.tblChatNickname', 'ClearedAt') IS NULL
    ALTER TABLE dbo.tblChatNickname ADD ClearedAt DATETIME2(0) NULL;
GO

/* Clear = record my ClearedAt (does NOT delete the shared rows). */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_ClearConversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;
    MERGE dbo.tblChatNickname AS t
    USING (SELECT @MeId AS MeId, @OtherId AS OtherId) AS s
    ON t.MeId = s.MeId AND t.OtherId = s.OtherId
    WHEN MATCHED THEN UPDATE SET ClearedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN INSERT (MeId, OtherId, ClearedAt) VALUES (@MeId, @OtherId, SYSUTCDATETIME());
END
GO

/* Conversation only shows messages newer than my ClearedAt. */
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
        ReplyMine = CASE WHEN r.SenderId = @MeId THEN 1 ELSE 0 END
    FROM dbo.tblChatMessage m
    LEFT JOIN dbo.tblChatMessage r ON r.MessageId = m.ReplyToId
    WHERE ((m.SenderId = @MeId AND m.ReceiverId = @OtherId) OR (m.SenderId = @OtherId AND m.ReceiverId = @MeId))
      AND m.SentAt > ISNULL(@ClearedAt, '19000101')
    ORDER BY m.SentAt;
END
GO

/* Contacts: last message + unread also respect my ClearedAt. */
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
                  WHERE m.SenderId = u.UserId AND m.ReceiverId = @MeId AND m.ReadAt IS NULL AND m.IsDeleted = 0
                    AND m.SentAt > ISNULL((SELECT ClearedAt FROM dbo.tblChatNickname c WHERE c.MeId = @MeId AND c.OtherId = u.UserId), '19000101'))
    FROM dbo.Users u
    OUTER APPLY (
        SELECT TOP 1 m.Body, m.FileData, m.FileName, m.SentAt, m.IsDeleted
        FROM dbo.tblChatMessage m
        WHERE ((m.SenderId = @MeId AND m.ReceiverId = u.UserId) OR (m.SenderId = u.UserId AND m.ReceiverId = @MeId))
          AND m.SentAt > ISNULL((SELECT ClearedAt FROM dbo.tblChatNickname c WHERE c.MeId = @MeId AND c.OtherId = u.UserId), '19000101')
        ORDER BY m.SentAt DESC
    ) lm
    WHERE u.UserId <> @MeId AND u.IsActive = 1
    ORDER BY CASE WHEN lm.SentAt IS NULL THEN 1 ELSE 0 END, lm.SentAt DESC, u.Username;
END
GO
