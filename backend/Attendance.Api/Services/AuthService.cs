using Attendance.Api.Models.Auth;
using Attendance.Api.Repositories;
using Attendance.Api.Services.Jwt;

namespace Attendance.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<(bool Ok, string Message)> ChangePasswordAsync(ChangePasswordRequest request);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;

    public AuthService(IUserRepository users, IPasswordHasher hasher, IJwtTokenService jwt)
    {
        _users = users;
        _hasher = hasher;
        _jwt = jwt;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _users.GetByUsernameAsync(request.Username);
        if (user is null || !user.IsActive)
            return null;

        if (!_hasher.Verify(request.Password, user.PasswordHash))
            return null;

        var (token, expiresAt) = _jwt.CreateToken(user);
        return new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            Username = user.Username,
            DisplayName = user.DisplayName ?? user.Username,
            Role = user.Role,
            GroupName = user.GroupName
        };
    }

    public async Task<(bool Ok, string Message)> ChangePasswordAsync(ChangePasswordRequest request)
    {
        var user = await _users.GetByUsernameAsync(request.Username);
        if (user is null || !user.IsActive)
            return (false, "User not found.");

        if (!_hasher.Verify(request.OldPassword, user.PasswordHash))
            return (false, "Old password is incorrect.");

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Trim().Length < 4)
            return (false, "New password must be at least 4 characters.");

        var hash = _hasher.Hash(request.NewPassword);
        await _users.UpdatePasswordAsync(user.UserId, hash);
        return (true, "Password changed. Please log in with your new password.");
    }
}
