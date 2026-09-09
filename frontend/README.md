# Unipro Attendance - Frontend (React + Vite + Tailwind)

Login UI wired to the .NET API.

## Prerequisites
- Node.js 18+ (installed: v24)
- The backend API running at http://localhost:5080 (see `../backend/README.md`)

## Run
```powershell
cd D:\Unipro\Attendance\frontend
npm install     # first time only
npm run dev
```
Open http://localhost:5173

Login with **sriram / sri@123** (requires the SQL scripts to be run and the API running).

## Config
- API base URL is set in `.env` -> `VITE_API_BASE_URL=http://localhost:5080/api`
- JWT token is stored in localStorage and attached to every request automatically.
