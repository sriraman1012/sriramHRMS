import { useState } from 'react'
import { login, changePassword } from '../api/auth.js'
import { API_BASE } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getLoginStyle } from '../prefs.js'

// Scattered floating glow bubbles for the login background.
const BUBBLES = [
  { top: '6%', left: '5%', zoom: 0.6, animationDelay: '0s' },
  { top: '10%', right: '8%', zoom: 0.45, animationDelay: '-4s' },
  { top: '52%', right: '5%', zoom: 0.5, animationDelay: '-6s' },
  { bottom: '6%', left: '9%', zoom: 0.4, animationDelay: '-3s' },
  { bottom: '12%', right: '16%', zoom: 0.55, animationDelay: '-5s' },
  { top: '38%', left: '3%', zoom: 0.35, animationDelay: '-2s' },
]

export default function Login({ theme, toggleTheme }) {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [signupMsg, setSignupMsg] = useState('')
  // One-time notice when the previous session ended due to 30 min of inactivity.
  const [notice, setNotice] = useState(() => {
    if (localStorage.getItem('att_logout_reason') === 'idle') {
      localStorage.removeItem('att_logout_reason')
      return 'You were signed out after 30 minutes of inactivity. Please log in again.'
    }
    return ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setNotice('')
    setError('')
    setLoading(true)
    try {
      const data = await login(username.trim(), password)
      signIn(data)
    } catch (err) {
      const status = err.response?.status
      if (!err.response) {
        // No HTTP response at all → genuine connectivity problem.
        setError(`Could not reach the API at ${API_BASE}. Check config.js (apiBaseUrl / apiPort), that the API is running, and that its port is open in the firewall.`)
      } else if (status === 401 || status === 400) {
        setError('Invalid or missing User ID / Password. Please enter both and try again.')
      } else {
        setError(err.response?.data?.message || `Login failed (HTTP ${status}).`)
      }
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const loginStyle = getLoginStyle()

  // Shared pieces used by both card styles.
  const logoHeader = (
    <div className="text-center mb-7">
      <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">UNIPRO</div>
      <div className="text-[26px] font-bold text-slate-100 mt-1 leading-tight">Unipro Attendance</div>
      <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">Attendance Management System</div>
      <div className="w-10 h-[3px] bg-blue-600 dark:bg-blue-500 rounded mx-auto mt-4" />
    </div>
  )
  const notices = (
    <>
      {notice && !error && (
        <div className="mb-4 rounded-md border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-bold px-4 py-3">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold px-4 py-3">
          {error}
        </div>
      )}
    </>
  )
  const signupNotice = signupMsg && (
    <div className="mt-4 rounded-md border border-blue-400/30 bg-blue-500/10 text-blue-200 text-[13px] font-bold px-4 py-2.5 text-center">
      {signupMsg}
    </div>
  )

  return (
    <div className="login-bg relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Floating glow bubbles background */}
      <div className="login-bubbles" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <div key={i} className="bubble" style={b}>
            <span /><span /><span /><span /><span />
          </div>
        ))}
      </div>

      {/* Flying eagles (two directions) */}
      <div className="login-eagle e1" aria-hidden="true"><span className="body">🦅</span></div>
      <div className="login-eagle e2" aria-hidden="true"><span className="body">🦅</span></div>
      <div className="login-eagle e3" aria-hidden="true"><span className="body">🦅</span></div>

      {/* Neumorphic theme toggle (same as the dashboard top bar) */}
      <div className="absolute top-5 right-5 z-20">
        <label className="neu-toggle" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} aria-label="Toggle dark mode" />
          <span className="button" />
          <span className="label">
            {theme === 'dark'
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}
          </span>
        </label>
      </div>

      {loginStyle === 'neu' ? (
        /* ---- Neumorphic dark form (Uiverse "Praashoo7") ---- */
        <div className="login-neu relative z-10 w-full max-w-[400px] shadow-2xl px-8 pt-8 pb-9">
          {logoHeader}
          {notices}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="field">
              <UserIcon />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="User ID" autoComplete="username" aria-label="User ID" className="input-field" />
            </div>
            <div className="field">
              <LockIcon />
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" autoComplete="current-password" aria-label="Password" className="input-field" />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'} title={showPwd ? 'Hide password' : 'Show password'}
                className="shrink-0 text-slate-400 hover:text-slate-200">
                {showPwd ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <div className="flex justify-center gap-2.5 mt-6">
              <button type="button" onClick={() => setSignupMsg('To create an account, please contact the Unipro Team admin.')} className="login-btn">
                Sign Up
              </button>
              <button type="submit" disabled={loading} className="login-btn px-8">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
            <div className="flex justify-center mt-1">
              <button type="button" onClick={() => { setForgotOpen(true); setSignupMsg('') }} className="login-btn danger">
                Forgot Password
              </button>
            </div>
          </form>
          {signupNotice}
          <div className="text-xs text-slate-500 text-center mt-5">Administrator access only for attendance edits</div>
        </div>
      ) : (
        /* ---- Default card (original design) ---- */
        <div className="relative z-10 w-full max-w-[400px] rounded-2xl border border-white/10 bg-[#161c2b] shadow-2xl p-10">
          {logoHeader}
          {notices}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[13px] font-bold text-slate-300 mb-1.5">User ID</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your user ID" autoComplete="username"
                className="w-full rounded-lg border border-white/15 bg-[#1e2235] text-slate-100 placeholder-slate-400 text-sm px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="mb-5">
              <label className="block text-[13px] font-bold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" autoComplete="current-password"
                  className="w-full rounded-lg border border-white/15 bg-[#1e2235] text-slate-100 placeholder-slate-400 text-sm pl-3.5 pr-11 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'} title={showPwd ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/10">
                  {showPwd ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[15px] font-bold py-3 tracking-wide transition-colors">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="flex items-center justify-between mt-4 text-[13px]">
            <button type="button" onClick={() => { setForgotOpen(true); setSignupMsg('') }}
              className="font-bold text-blue-400 hover:text-blue-300">Forgot password?</button>
            <button type="button" onClick={() => setSignupMsg('To create an account, please contact the Unipro Team admin.')}
              className="font-bold text-slate-300 hover:text-slate-100">Sign up</button>
          </div>
          {signupNotice}
          <div className="text-xs text-slate-400 text-center mt-4">Administrator access only for attendance edits</div>
        </div>
      )}

      {forgotOpen && <ForgotPasswordModal presetUser={username} onClose={() => setForgotOpen(false)} />}
    </div>
  )
}

// Change-password form: verifies the old password against the database, then sets the new one.
function ForgotPasswordModal({ presetUser, onClose }) {
  const [user, setUser] = useState(presetUser || '')
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const inputCls = 'w-full rounded-lg border border-white/15 bg-[#1e2235] text-slate-100 placeholder-slate-400 text-sm px-3.5 py-2.5 outline-none focus:border-blue-500'

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setOk('')
    if (!user.trim()) return setErr('Enter your User ID.')
    if (!oldPwd) return setErr('Enter your old password.')
    if (newPwd.length < 4) return setErr('New password must be at least 4 characters.')
    if (newPwd !== confirm) return setErr('New password and confirm password do not match.')
    setBusy(true)
    try {
      const res = await changePassword(user.trim(), oldPwd, newPwd)
      setOk(res.message || 'Password changed. Please log in with your new password.')
      setOldPwd(''); setNewPwd(''); setConfirm('')
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not change the password. Check the server is running.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#161c2b] text-slate-100 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold">Change Password</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white/10 text-lg font-bold">×</button>
        </div>
        <p className="text-[12px] text-slate-400 mb-4">Enter your old password, then set a new one.</p>
        {err && <div className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 text-[13px] font-bold px-3 py-2">{err}</div>}
        {ok && <div className="mb-3 rounded-md border border-green-500/20 bg-green-500/10 text-green-400 text-[13px] font-bold px-3 py-2">{ok}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1">User ID</label>
            <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" className={inputCls} />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1">Old Password</label>
            <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} autoComplete="current-password" className={inputCls} />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1">New Password</label>
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" className={inputCls} />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-1">Confirm New Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/15 text-sm font-bold text-slate-300">Close</button>
            <button disabled={busy} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">{busy ? 'Saving…' : 'Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UserIcon() {
  return (
    <svg className="input-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12Zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9Z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="input-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-5 9a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6ZM14.2 8H9.8V6a2.2 2.2 0 0 1 4.4 0v2Z" />
    </svg>
  )
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
      <path d="M6.6 6.6A13.1 13.1 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 5.4-1.6" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}
