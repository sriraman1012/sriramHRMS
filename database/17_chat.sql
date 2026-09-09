/* =====================================================================
   Unipro Attendance - Chat Messages module (WhatsApp-style internal chat)
   Adds profile columns to Users, a message table, and stored procedures
   for contacts, conversation, send, read receipts, presence & profile.
   Run after 02_rbac_tables.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* ---- Profile columns on Users ---- */
IF COL_LENGTH('dbo.Users', 'ProfilePic') IS NULL ALTER TABLE dbo.Users ADD ProfilePic NVARCHAR(MAX) NULL;     -- base64 data URI
IF COL_LENGTH('dbo.Users', 'About')      IS NULL ALTER TABLE dbo.Users ADD About      NVARCHAR(200) NULL;     -- status / description
IF COL_LENGTH('dbo.Users', 'LastSeen')   IS NULL ALTER TABLE dbo.Users ADD LastSeen   DATETIME2(0)  NULL;     -- presence heartbeat
GO

/* ---- Messages ---- */
IF OBJECT_ID(N'dbo.tblChatMessage', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblChatMessage
    (
        MessageId   INT           IDENTITY(1,1) NOT NULL,
        SenderId    INT           NOT NULL,
        ReceiverId  INT           NOT NULL,
        Body        NVARCHAR(MAX) NULL,
        FileData    NVARCHAR(MAX) NULL,   -- base64 data URI (optional attachment)
        FileName    NVARCHAR(200) NULL,
        FileType    NVARCHAR(100) NULL,
        SentAt      DATETIME2(0)  NOT NULL CONSTRAINT DF_Chat_SentAt DEFAULT (SYSUTCDATETIME()),
        DeliveredAt DATETIME2(0)  NULL,
        ReadAt      DATETIME2(0)  NULL,
        CONSTRAINT PK_tblChatMessage PRIMARY KEY (MessageId),
        CONSTRAINT FK_Chat_Sender   FOREIGN KEY (SenderId)   REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Chat_Receiver FOREIGN KEY (ReceiverId) REFERENCES dbo.Users(UserId)
    );
    CREATE INDEX IX_Chat_Pair ON dbo.tblChatMessage (SenderId, ReceiverId, SentAt);
END
GO

/* Online = seen in the last 65 seconds. */
/* ---- Contact list for the current user: everyone else + last msg + unread ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Contacts
    @MeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId, u.UserCode, u.Username, u.About, u.ProfilePic, u.LastSeen,
        IsOnline = CASE WHEN u.LastSeen >= DATEADD(SECOND, -65, SYSUTCDATETIME()) THEN 1 ELSE 0 END,
        LastMessage = CASE WHEN lm.FileData IS NOT NULL AND (lm.Body IS NULL OR lm.Body = N'')
                           THEN N'📎 ' + ISNULL(lm.FileName, N'Attachment') ELSE lm.Body END,
        LastAt = lm.SentAt,
        Unread = (SELECT COUNT(*) FROM dbo.tblChatMessage m
                  WHERE m.SenderId = u.UserId AND m.ReceiverId = @MeId AND m.ReadAt IS NULL)
    FROM dbo.Users u
    OUTER APPLY (
        SELECT TOP 1 m.Body, m.FileData, m.FileName, m.SentAt
        FROM dbo.tblChatMessage m
        WHERE (m.SenderId = @MeId AND m.ReceiverId = u.UserId)
           OR (m.SenderId = u.UserId AND m.ReceiverId = @MeId)
        ORDER BY m.SentAt DESC
    ) lm
    WHERE u.UserId <> @MeId AND u.IsActive = 1
    ORDER BY CASE WHEN lm.SentAt IS NULL THEN 1 ELSE 0 END, lm.SentAt DESC, u.Username;
END
GO

/* ---- Conversation between me and another user ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Conversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MessageId, SenderId, ReceiverId, Body, FileData, FileName, FileType, SentAt, DeliveredAt, ReadAt,
           Mine = CASE WHEN SenderId = @MeId THEN 1 ELSE 0 END
    FROM dbo.tblChatMessage
    WHERE (SenderId = @MeId AND ReceiverId = @OtherId) OR (SenderId = @OtherId AND ReceiverId = @MeId)
    ORDER BY SentAt;
END
GO

/* ---- Send a message ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Send
    @SenderId INT, @ReceiverId INT,
    @Body NVARCHAR(MAX) = NULL, @FileData NVARCHAR(MAX) = NULL,
    @FileName NVARCHAR(200) = NULL, @FileType NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT dbo.tblChatMessage (SenderId, ReceiverId, Body, FileData, FileName, FileType)
    VALUES (@SenderId, @ReceiverId, @Body, @FileData, @FileName, @FileType);
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS MessageId, SYSUTCDATETIME() AS SentAt;
END
GO

/* ---- Mark all messages from @OtherId to me as read (blue double tick) ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_MarkRead
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.tblChatMessage
        SET ReadAt = SYSUTCDATETIME(), DeliveredAt = ISNULL(DeliveredAt, SYSUTCDATETIME())
    WHERE ReceiverId = @MeId AND SenderId = @OtherId AND ReadAt IS NULL;
END
GO

/* ---- Presence heartbeat: bump LastSeen + mark my inbound msgs delivered ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_Heartbeat
    @MeId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users SET LastSeen = SYSUTCDATETIME() WHERE UserId = @MeId;
    UPDATE dbo.tblChatMessage SET DeliveredAt = SYSUTCDATETIME()
    WHERE ReceiverId = @MeId AND DeliveredAt IS NULL;
END
GO

/* ---- Profile get / update ---- */
CREATE OR ALTER PROCEDURE dbo.SP_Chat_GetProfile
    @MeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserId, UserCode, Username, About, ProfilePic FROM dbo.Users WHERE UserId = @MeId;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_Chat_UpdateProfile
    @MeId INT, @About NVARCHAR(200) = NULL, @ProfilePic NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users SET About = @About, ProfilePic = @ProfilePic, UpdatedAt = SYSUTCDATETIME()
    WHERE UserId = @MeId;
END
GO
