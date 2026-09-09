/* =====================================================================
   Unipro Attendance - Chat: hard-delete a conversation (free storage)
   Used by the Storage manager's per-user trash: actually removes the
   message rows so storage usage drops (permanent, affects both sides).
   Run after 19_chat_clear.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

CREATE OR ALTER PROCEDURE dbo.SP_Chat_PurgeConversation
    @MeId INT, @OtherId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblChatMessage
    WHERE (SenderId = @MeId AND ReceiverId = @OtherId) OR (SenderId = @OtherId AND ReceiverId = @MeId);
    -- also clear any leftover "cleared" marker so the pair resets cleanly
    UPDATE dbo.tblChatNickname SET ClearedAt = NULL WHERE MeId = @MeId AND OtherId = @OtherId;
END
GO
