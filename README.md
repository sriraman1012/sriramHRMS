# Unipro Attendance Management System (sriramHRMS)

Attendance + HR management for the Unipro Implementation Team.

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** ASP.NET Core 8 Web API (Dapper, JWT, SQL Server stored procedures)
- **Database:** SQL Server (`ATTANDANCE_IMP`)

## Project layout

| Folder | Contents |
|--------|----------|
| `frontend/` | React app (source in `src/`, runtime config in `public/config.js`) |
| `backend/Attendance.Api/` | ASP.NET Core Web API |
| `database/` | Numbered SQL migration scripts (run in order) |

## Local setup

### 1. Database
Run the scripts in `database/` in numeric order against a SQL Server instance
(creates `ATTANDANCE_IMP`, tables, stored procedures, and seed data).

### 2. Backend
```bash
cd backend/Attendance.Api
cp appsettings.example.json appsettings.json   # then fill in your DB + JWT values
dotnet run
```
`appsettings.json` is gitignored (holds the DB password + JWT secret) — create it
from `appsettings.example.json`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Set the backend URL in `frontend/public/config.js` (`apiBaseUrl`). Use `"/api"`
when the frontend is served from the backend's `wwwroot` (single-site hosting).

## Single-site hosting (recommended for IIS)
Build the frontend and copy it into the API's `wwwroot`, then publish the backend —
one site serves both the SPA and `/api` (no CORS, SSL covers both):
```bash
cd frontend && npm run build
# copy frontend/dist/* into backend/Attendance.Api/wwwroot/
cd ../backend/Attendance.Api && dotnet publish -c Release -o publish
```
See `DEPLOY_IIS.md` for full IIS steps.
