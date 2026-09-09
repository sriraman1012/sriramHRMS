import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext(null)

// Auto sign-out after this many minutes with NO user activity.
const IDLE_MINUTES = 30
const IDLE_MS = IDLE_MINUTES * 60 * 1000

export function AuthProvider({ children }) {
  // Restore session from localStorage on first load.
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem('att_auth')
    return raw ? JSON.parse(raw) : null
  })
  const lastActivity = useRef(Date.now())

  const signIn = (data) => {
    localStorage.removeItem('att_logout_reason')
    localStorage.setItem('att_token', data.token)
    localStorage.setItem('att_auth', JSON.stringify(data))
    lastActivity.current = Date.now()
    setAuth(data)
  }

  const signOut = (reason) => {
    if (reason) localStorage.setItem('att_logout_reason', reason)
    localStorage.removeItem('att_token')
    localStorage.removeItem('att_auth')
    setAuth(null)
  }

  // Idle auto-logout: only runs while signed in. Any interaction marks activity
  // (cheap), and a lightweight interval checks whether 30 min have elapsed.
  useEffect(() => {
    if (!auth) return
    lastActivity.current = Date.now()
    const mark = () => { lastActivity.current = Date.now() }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current >= IDLE_MS) signOut('idle')
    }, 30 * 1000)
    return () => {
      clearInterval(timer)
      events.forEach((e) => window.removeEventListener(e, mark))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth])

  return (
    <AuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
