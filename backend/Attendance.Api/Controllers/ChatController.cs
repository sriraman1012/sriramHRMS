using System.Security.Claims;
using Attendance.Api.Models.Chat;
using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatRepository _repo;
    public ChatController(IChatRepository repo) => _repo = repo;

    private int MeId()
    {
        var raw = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(raw, out var id) ? id : 0;
    }

    /// <summary>All other users with presence, last message and unread count.</summary>
    [HttpGet("contacts")]
    public async Task<IActionResult> Contacts() => Ok(await _repo.GetContactsAsync(MeId()));

    /// <summary>Conversation between me and another user (also marks it read).</summary>
    [HttpGet("conversation/{otherId:int}")]
    public async Task<IActionResult> Conversation(int otherId)
    {
        var me = MeId();
        var msgs = await _repo.GetConversationAsync(me, otherId);
        await _repo.MarkReadAsync(me, otherId);
        return Ok(msgs);
    }

    /// <summary>Send a text and/or file message.</summary>
    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] ChatSendRequest req)
    {
        if (req.ReceiverId <= 0 || (string.IsNullOrWhiteSpace(req.Body) && string.IsNullOrEmpty(req.FileData)))
            return BadRequest(new { message = "Nothing to send." });
        var (messageId, sentAt) = await _repo.SendAsync(MeId(), req);
        return Ok(new { messageId, sentAt });
    }

    /// <summary>Mark a conversation as read (blue ticks).</summary>
    [HttpPost("read/{otherId:int}")]
    public async Task<IActionResult> MarkRead(int otherId)
    {
        await _repo.MarkReadAsync(MeId(), otherId);
        return Ok(new { message = "ok" });
    }

    /// <summary>Presence heartbeat (keeps me online + marks inbound delivered).</summary>
    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat()
    {
        await _repo.HeartbeatAsync(MeId());
        return Ok(new { message = "ok" });
    }

    /// <summary>My chat profile (picture + about).</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var p = await _repo.GetProfileAsync(MeId());
        return p is null ? NotFound() : Ok(p);
    }

    /// <summary>Update my chat profile (picture + about).</summary>
    [HttpPost("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] ChatProfileUpdateRequest req)
    {
        await _repo.UpdateProfileAsync(MeId(), req);
        return Ok(new { message = "Profile updated." });
    }

    /// <summary>Edit one of my messages.</summary>
    [HttpPost("edit")]
    public async Task<IActionResult> Edit([FromBody] ChatEditRequest req)
    {
        await _repo.EditMessageAsync(MeId(), req.MessageId, req.Body ?? string.Empty);
        return Ok(new { message = "ok" });
    }

    /// <summary>Delete one of my messages (shows "deleted" to both).</summary>
    [HttpDelete("message/{messageId:int}")]
    public async Task<IActionResult> DeleteMessage(int messageId)
    {
        await _repo.DeleteMessageAsync(MeId(), messageId);
        return Ok(new { message = "ok" });
    }

    /// <summary>Clear the whole conversation with a user (one-sided).</summary>
    [HttpDelete("conversation/{otherId:int}")]
    public async Task<IActionResult> ClearConversation(int otherId)
    {
        await _repo.ClearConversationAsync(MeId(), otherId);
        return Ok(new { message = "Chat cleared." });
    }

    /// <summary>Permanently delete a conversation to free storage (both sides).</summary>
    [HttpDelete("conversation/{otherId:int}/purge")]
    public async Task<IActionResult> PurgeConversation(int otherId)
    {
        await _repo.PurgeConversationAsync(MeId(), otherId);
        return Ok(new { message = "Chat deleted." });
    }

    /// <summary>Set a personal nickname for a contact (chat only).</summary>
    [HttpPost("nickname")]
    public async Task<IActionResult> SetNickname([FromBody] ChatNicknameRequest req)
    {
        await _repo.SetNicknameAsync(MeId(), req.OtherId, string.IsNullOrWhiteSpace(req.Nickname) ? null : req.Nickname.Trim());
        return Ok(new { message = "Nickname saved." });
    }

    /// <summary>Per-contact chat storage usage.</summary>
    [HttpGet("storage")]
    public async Task<IActionResult> Storage() => Ok(await _repo.GetStorageAsync(MeId()));

    /// <summary>Toggle an emoji reaction on a message (WhatsApp-style badge).</summary>
    [HttpPost("react")]
    public async Task<IActionResult> React([FromBody] ChatReactRequest req)
    {
        if (req.MessageId <= 0 || string.IsNullOrWhiteSpace(req.Emoji)) return BadRequest(new { message = "Nothing to react." });
        await _repo.ReactAsync(MeId(), req.MessageId, req.Emoji.Trim());
        return Ok(new { message = "ok" });
    }

    /// <summary>Audit log of chat deletions (message / clear / purge) — Chat Delete Log report.
    /// Access is gated on the frontend by the 'rpt-chat-delete' view right (same as other report GETs).</summary>
    [HttpGet("delete-log")]
    public async Task<IActionResult> DeleteLog([FromQuery] string? from, [FromQuery] string? to)
    {
        DateTime? f = DateTime.TryParse(from, out var fd) ? fd : null;
        DateTime? t = DateTime.TryParse(to, out var td) ? td : null;
        return Ok(await _repo.GetDeleteLogAsync(f, t));
    }
}
