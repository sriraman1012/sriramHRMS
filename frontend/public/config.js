/* ===========================================================================
   RUNTIME CONFIG  —  edit this file ON THE SERVER after deployment.
   It is plain JavaScript (NOT bundled), so changing it here takes effect on the
   next browser refresh — no rebuild required.

   apiBaseUrl : Backend API base URL, INCLUDING the /api suffix.
     • "/api"                         → SAME origin as the site (RECOMMENDED when
                                         the frontend is hosted inside the backend
                                         wwwroot — one IIS site, works with SSL,
                                         no CORS, no port to open separately).
     • "http://192.168.1.50:5080/api" → a specific backend host:port (separate
                                         site). Must match the site's scheme
                                         (use https:// if the page is https).
     • ""                             → auto: same hostname, on apiPort below
                                         (http only — avoid when using SSL).

   apiPort    : Backend port, used ONLY when apiBaseUrl is "".
   =========================================================================== */
window.APP_CONFIG = {
  // Single-site hosting (frontend served from the backend's wwwroot): keep "/api".
  apiBaseUrl: '/api',
  apiPort: 5080,
}
