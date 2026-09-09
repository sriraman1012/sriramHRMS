# Hosting Unipro Attendance on IIS

Two separate IIS sites, each on its own port:

| Component | Type | Example port | Physical folder |
|-----------|------|--------------|-----------------|
| **Backend API** (.NET 8) | IIS site, in-process ASP.NET Core | **5080** | `C:\inetpub\UniproAttendance\api` |
| **Frontend** (React build) | IIS static site | **8080** | `C:\inetpub\UniproAttendance\web` |

You can pick any free ports — just keep them consistent below.

---

## 1. Install on the server (once)

1. **.NET 8 Hosting Bundle** — lets IIS run the API.
   https://dotnet.microsoft.com/download/dotnet/8.0 → *ASP.NET Core Runtime → Hosting Bundle*.
   After installing, run `iisreset` (or reboot).
2. **URL Rewrite module** — needed for the frontend SPA routing.
   https://www.iis.net/downloads/microsoft/url-rewrite
3. **SQL Server** with the `ATTANDANCE_IMP` database and all stored procedures already created.
4. IIS itself (Windows feature *Internet Information Services*).

---

## 2. Build the two projects (on your dev machine)

### Backend
```powershell
cd d:\Unipro\Attendance\backend\Attendance.Api
dotnet publish -c Release -o d:\Unipro\Attendance\backend\publish
```
Output → `backend\publish\` (contains `Attendance.Api.dll`, `web.config`, `appsettings.json`, …).

### Frontend
```powershell
cd d:\Unipro\Attendance\frontend
npm install
npm run build
```
Output → `frontend\dist\` (contains `index.html`, `assets\`, `config.js`, `web.config`).

Copy `backend\publish\` → the server's **api** folder, and `frontend\dist\` → the server's **web** folder.

---

## 3. Configure the backend

Edit `appsettings.json` in the **api** folder on the server:

- **ConnectionStrings:DefaultConnection** — point `Server=` at the SQL Server.
  `Server=.` works only if SQL runs on the *same* machine as IIS; otherwise use
  `Server=SERVERNAME\INSTANCE` or an IP.
- (Optional but recommended) change **Jwt:SecretKey** to your own long random string.

---

## 4. Create the Backend site in IIS

1. **Application Pools → Add Application Pool**
   - Name: `UniproApi`
   - .NET CLR version: **No Managed Code**  ← important (ASP.NET Core is out-of-runtime)
   - Start immediately.
2. **Sites → Add Website**
   - Site name: `UniproAttendanceApi`
   - Application pool: `UniproApi`
   - Physical path: the **api** folder (e.g. `C:\inetpub\UniproAttendance\api`)
   - Binding: type `http`, port **5080**, host name blank.
3. Give the app-pool identity read access to the api folder (usually automatic).
4. Verify: browse **http://localhost:5080/swagger** on the server — the API docs page
   should load.

> The API's port is the **IIS binding port** (5080) — not set in code.

---

## 5. Create the Frontend site in IIS

1. **Sites → Add Website**
   - Site name: `UniproAttendanceWeb`
   - Application pool: leave the default (static files only).
   - Physical path: the **web** folder (e.g. `C:\inetpub\UniproAttendance\web`)
   - Binding: type `http`, port **8080**, host name blank.
2. The `web.config` already in that folder handles SPA routing (needs the URL Rewrite
   module from step 1).

---

## 6. Point the frontend at the backend

Edit **`config.js`** in the **web** folder on the server. This is a plain file — no
rebuild needed, just refresh the browser afterwards.

- If the API and the website are on the **same machine** (typical): leave
  `apiBaseUrl` empty and just set the port:
  ```js
  window.APP_CONFIG = { apiBaseUrl: '', apiPort: 5080 }
  ```
  The app then calls the API on the same hostname the user opened the site with.

- If the API is on a **different machine**, set the full URL:
  ```js
  window.APP_CONFIG = { apiBaseUrl: 'http://192.168.1.50:5080/api', apiPort: 5080 }
  ```

---

## 7. Open the firewall (for other machines on the LAN)

Run in an **Administrator** PowerShell on the server:
```powershell
New-NetFirewallRule -DisplayName "Unipro Web 8080"  -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
New-NetFirewallRule -DisplayName "Unipro API 5080"  -Direction Inbound -Protocol TCP -LocalPort 5080 -Action Allow
```

---

## 8. Use it

- On the server: **http://localhost:8080**
- From any PC/phone on the LAN: **http://SERVER-IP:8080** or **http://SERVER-NAME:8080**

Log in with your seeded account.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **HTTP 500.19 / 500.30** on the API | .NET 8 **Hosting Bundle** not installed, or app pool isn't *No Managed Code*. Install bundle, run `iisreset`. |
| Frontend loads but **"Could not reach the server"** | `config.js` port wrong, API site stopped, or firewall blocking 5080. Test `http://SERVER:5080/swagger`. |
| Refreshing a page gives **404** | URL Rewrite module not installed (frontend `web.config` rule can't run). |
| **CORS** error in browser console | API already allows any origin; usually means the API URL in `config.js` is wrong (hitting the site port instead of the API port). |
| Login works locally but not from other PCs | Firewall rules (step 7), or `config.js apiBaseUrl` hardcoded to `localhost` — leave it empty for same-machine. |

---

## Redeploying after code changes

- **Backend changed** → re-run `dotnet publish`, copy over the **api** folder
  (stop the site or app pool first if files are locked), start it again.
- **Frontend changed** → re-run `npm run build`, copy `dist\` over the **web** folder.
  `config.js` on the server is preserved only if you don't overwrite it — keep a copy,
  or re-edit it after copying.
