namespace Attendance.Api.Services.Jwt;

/// <summary>Binds to the "Jwt" section of appsettings.json.</summary>
public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 480;
}
