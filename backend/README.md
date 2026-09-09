# Unipro Attendance - Backend API

ASP.NET Core 8 Web API (Swagger) using Dapper + SQL Server stored procedures.

## Prerequisites
- **.NET 8 SDK** (not currently installed on this machine - see below)
- **SQL Server** (any edition, incl. Express/LocalDB)

### Install the .NET 8 SDK
```powershell
winget install Microsoft.DotNet.SDK.8
```
Close and reopen the terminal afterwards so `dotnet` is on PATH.

## 1. Set up the database
Run these scripts (SSMS or `sqlcmd`), in order, against your SQL Server:
1. `../database/00_create_database.sql`  - creates the `UniproAttendance` database
2. `../database/01_login_setup.sql`      - Users table + seed admin + login SP

Seed admin login: **sriram / sri@123**

## 2. Configure the connection string
Edit `Attendance.Api/appsettings.json` -> `ConnectionStrings:DefaultConnection`
with your server/user/password. Also set a real `Jwt:SecretKey` (32+ chars).

## 3. Run the API
```powershell
cd Attendance.Api
dotnet restore
dotnet run
```
Swagger UI: http://localhost:5080/swagger

## 4. Test login
In Swagger, expand **POST /api/auth/login**, "Try it out", send:
```json
{ "username": "sriram", "password": "sri@123" }
```
A `200` with a `token` means it works. `401` means bad credentials or DB not set up.
