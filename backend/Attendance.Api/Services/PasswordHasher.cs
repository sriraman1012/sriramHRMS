using System.Security.Cryptography;
using System.Text;

namespace Attendance.Api.Services;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string storedHash);
}

/// <summary>
/// SHA-256 hashing to match the hashes stored in dbo.Users.
/// NOTE: SHA-256 is adequate for this internal tool; upgrade to BCrypt/PBKDF2 later if needed.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public bool Verify(string password, string storedHash) =>
        string.Equals(Hash(password), storedHash, StringComparison.OrdinalIgnoreCase);
}
