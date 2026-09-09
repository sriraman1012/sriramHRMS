using System.Data;
using Attendance.Api.Data;
using Attendance.Api.Models.Entities;
using Dapper;

namespace Attendance.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task UpdatePasswordAsync(int userId, string passwordHash);
}

public class UserRepository : IUserRepository
{
    private readonly ISqlConnectionFactory _factory;

    public UserRepository(ISqlConnectionFactory factory) => _factory = factory;

    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<User>(
            "SP_User_GetByUsername",
            new { Username = username },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdatePasswordAsync(int userId, string passwordHash)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync(
            "SP_User_ChangePassword",
            new { UserId = userId, PasswordHash = passwordHash },
            commandType: CommandType.StoredProcedure);
    }
}
