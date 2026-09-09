using System.Data;
using Attendance.Api.Data;
using Attendance.Api.Models.Chat;
using Dapper;

namespace Attendance.Api.Repositories;

public interface IChatRepository
{
    Task<IEnumerable<ChatContactDto>> GetContactsAsync(int meId);
    Task<IEnumerable<ChatMessageDto>> GetConversationAsync(int meId, int otherId);
    Task<(int MessageId, DateTime SentAt)> SendAsync(int senderId, ChatSendRequest req);
    Task MarkReadAsync(int meId, int otherId);
    Task HeartbeatAsync(int meId);
    Task<ChatProfileDto?> GetProfileAsync(int meId);
    Task UpdateProfileAsync(int meId, ChatProfileUpdateRequest req);
    Task EditMessageAsync(int meId, int messageId, string body);
    Task DeleteMessageAsync(int meId, int messageId);
    Task ClearConversationAsync(int meId, int otherId);
    Task PurgeConversationAsync(int meId, int otherId);
    Task SetNicknameAsync(int meId, int otherId, string? nickname);
    Task<IEnumerable<ChatStorageDto>> GetStorageAsync(int meId);
    Task<IEnumerable<ChatDeleteLogDto>> GetDeleteLogAsync(DateTime? from, DateTime? to);
    Task ReactAsync(int meId, int messageId, string emoji);
}

public class ChatRepository : IChatRepository
{
    private readonly ISqlConnectionFactory _factory;
    private const CommandType SP = CommandType.StoredProcedure;
    public ChatRepository(ISqlConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<ChatContactDto>> GetContactsAsync(int meId)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ChatContactDto>("SP_Chat_Contacts", new { MeId = meId }, commandType: SP);
    }

    public async Task<IEnumerable<ChatMessageDto>> GetConversationAsync(int meId, int otherId)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ChatMessageDto>("SP_Chat_Conversation", new { MeId = meId, OtherId = otherId }, commandType: SP);
    }

    public async Task<(int, DateTime)> SendAsync(int senderId, ChatSendRequest req)
    {
        using var db = _factory.Create();
        var row = await db.QuerySingleAsync<(int MessageId, DateTime SentAt)>(
            "SP_Chat_Send",
            new { SenderId = senderId, req.ReceiverId, req.Body, req.FileData, req.FileName, req.FileType, req.ReplyToId },
            commandType: SP);
        return row;
    }

    public async Task EditMessageAsync(int meId, int messageId, string body)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_EditMessage", new { MeId = meId, MessageId = messageId, Body = body }, commandType: SP);
    }

    public async Task DeleteMessageAsync(int meId, int messageId)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_DeleteMessage", new { MeId = meId, MessageId = messageId }, commandType: SP);
    }

    public async Task ClearConversationAsync(int meId, int otherId)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_ClearConversation", new { MeId = meId, OtherId = otherId }, commandType: SP);
    }

    public async Task PurgeConversationAsync(int meId, int otherId)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_PurgeConversation", new { MeId = meId, OtherId = otherId }, commandType: SP);
    }

    public async Task SetNicknameAsync(int meId, int otherId, string? nickname)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_SetNickname", new { MeId = meId, OtherId = otherId, Nickname = nickname }, commandType: SP);
    }

    public async Task<IEnumerable<ChatStorageDto>> GetStorageAsync(int meId)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ChatStorageDto>("SP_Chat_Storage", new { MeId = meId }, commandType: SP);
    }

    public async Task<IEnumerable<ChatDeleteLogDto>> GetDeleteLogAsync(DateTime? from, DateTime? to)
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ChatDeleteLogDto>("SP_ChatDeleteLog_GetAll", new { From = from, To = to }, commandType: SP);
    }

    public async Task ReactAsync(int meId, int messageId, string emoji)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_React", new { MeId = meId, MessageId = messageId, Emoji = emoji }, commandType: SP);
    }

    public async Task MarkReadAsync(int meId, int otherId)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_MarkRead", new { MeId = meId, OtherId = otherId }, commandType: SP);
    }

    public async Task HeartbeatAsync(int meId)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_Heartbeat", new { MeId = meId }, commandType: SP);
    }

    public async Task<ChatProfileDto?> GetProfileAsync(int meId)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<ChatProfileDto>("SP_Chat_GetProfile", new { MeId = meId }, commandType: SP);
    }

    public async Task UpdateProfileAsync(int meId, ChatProfileUpdateRequest req)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Chat_UpdateProfile", new { MeId = meId, req.About, req.ProfilePic }, commandType: SP);
    }
}
