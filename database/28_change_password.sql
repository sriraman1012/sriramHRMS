/* =====================================================================
   Unipro Attendance - Self-service change password
   Updates a user's password hash (after the API verifies the old password).
   Run against ATTANDANCE_IMP. Re-runnable.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

CREATE OR ALTER PROCEDURE dbo.SP_User_ChangePassword
    @UserId       INT,
    @PasswordHash NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users SET PasswordHash = @PasswordHash WHERE UserId = @UserId;
END
GO
