import axios from 'axios'

// API base URL comes from /config.js (window.APP_CONFIG) — the runtime config
// you edit on the server after deployment, so it can change with NO rebuild.
// Resolution (first match wins):
//  1. APP_CONFIG.apiBaseUrl if set (full URL incl. /api).
//  2. Auto-detect: SAME host the app is opened from, on APP_CONFIG.apiPort
//     (default 5080). Covers LAN setups where site + API share a machine.
const cfg = (typeof window !== 'undefined' && window.APP_CONFIG) || {}
const apiBase =
  (cfg.apiBaseUrl && cfg.apiBaseUrl.trim()) ||
  `http://${window.location.hostname}:${cfg.apiPort || 5080}/api`
// Exposed so screens (e.g. the login error) can show exactly which URL was called.
export const API_BASE = apiBase

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT token (if we have one) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('att_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Project-wide name casing: display names come back Title Cased ("Human
// Resources", "Jana") no matter how they were typed/stored — so the whole app
// reads cleanly. ONLY the display-name fields below are touched; codes, IDs,
// usernames, emails and passwords are deliberately left exactly as stored.
// ---------------------------------------------------------------------------
const NAME_KEYS = new Set([
  'name', 'employeename', 'departmentname', 'designationname', 'designation',
  'leavetypename', 'officename', 'holidayname', 'shiftname', 'groupname',
])
const toTitle = (s) => s.toLowerCase().replace(/[\p{L}][\p{L}']*/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1))
const normalizeNames = (node) => {
  if (Array.isArray(node)) { node.forEach(normalizeNames); return }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      const v = node[k]
      if (typeof v === 'string' && v && NAME_KEYS.has(k.toLowerCase())) node[k] = toTitle(v)
      else if (v && typeof v === 'object') normalizeNames(v)
    }
  }
}
api.interceptors.response.use((res) => {
  try { normalizeNames(res.data) } catch { /* never break a response over cosmetics */ }
  return res
})

export default api
