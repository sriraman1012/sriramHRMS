using Attendance.Api.Authorization;
using Attendance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

// Encrypt / Decrypt tool — legacy ERP-compatible TripleDES values.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EncryptController : ControllerBase
{
    private readonly IErpCipher _cipher;
    public EncryptController(IErpCipher cipher) => _cipher = cipher;

    public class CipherRequest { public string? Value { get; set; } }

    [HttpPost("encrypt")]
    [RequireRight("encrypt", "view")]
    public IActionResult Encrypt([FromBody] CipherRequest req)
    {
        try { return Ok(new { result = _cipher.Encrypt(req.Value ?? string.Empty) }); }
        catch (Exception ex) { return BadRequest(new { message = "Could not encrypt: " + ex.Message }); }
    }

    [HttpPost("decrypt")]
    [RequireRight("encrypt", "view")]
    public IActionResult Decrypt([FromBody] CipherRequest req)
    {
        try { return Ok(new { result = _cipher.Decrypt(req.Value ?? string.Empty) }); }
        catch (Exception) { return BadRequest(new { message = "Not a valid encrypted value (check for typos / extra spaces)." }); }
    }
}
