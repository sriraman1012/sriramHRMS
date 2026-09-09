namespace Attendance.Api.Models.Chat;

public class ChatContactDto
{
    public int UserId { get; set; }
    public string? UserCode { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? About { get; set; }
    public string? ProfilePic { get; set; }
    public DateTime? LastSeen { get; set; }
    public bool IsOnline { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastAt { get; set; }
    public int Unread { get; set; }
    public string? Nickname { get; set; }
}

public class ChatMessageDto
{
    public int MessageId { get; set; }
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public string? Body { get; set; }
    public string? FileData { get; set; }
    public string? FileName { get; set; }
    public string? FileType { get; set; }
    public DateTime SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
    public int? ReplyToId { get; set; }
    public string? ReplyBody { get; set; }
    public bool ReplyMine { get; set; }
    public bool Mine { get; set; }
    public string? Reactions { get; set; }
}

public class ChatReactRequest
{
    public int MessageId { get; set; }
    public string Emoji { get; set; } = string.Empty;
}

public class ChatSendRequest
{
    public int ReceiverId { get; set; }
    public string? Body { get; set; }
    public string? FileData { get; set; }
    public string? FileName { get; set; }
    public string? FileType { get; set; }
    public int? ReplyToId { get; set; }
}

public class ChatEditRequest
{
    public int MessageId { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class ChatNicknameRequest
{
    public int OtherId { get; set; }
    public string? Nickname { get; set; }
}

public class ChatStorageDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Messages { get; set; }
    public long Bytes { get; set; }
}

public class ChatProfileDto
{
    public int UserId { get; set; }
    public string? UserCode { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? About { get; set; }
    public string? ProfilePic { get; set; }
}

public class ChatProfileUpdateRequest
{
    public string? About { get; set; }
    public string? ProfilePic { get; set; }
}

public class ChatDeleteLogDto
{
    public int LogId { get; set; }
    public string DeleteType { get; set; } = string.Empty;   // message | clear | purge
    public DateTime DeletedAt { get; set; }
    public int ActorUserId { get; set; }
    public string? ActorName { get; set; }
    public int? OtherUserId { get; set; }
    public string? OtherName { get; set; }
    public int? MessageId { get; set; }
    public int? SenderId { get; set; }
    public string? SenderName { get; set; }
    public int? ReceiverId { get; set; }
    public string? ReceiverName { get; set; }
    public string? BodySnapshot { get; set; }
    public string? FileName { get; set; }
    public int? MessageCount { get; set; }
    public DateTime? SentAt { get; set; }
}
