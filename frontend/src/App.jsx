import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { RightsProvider } from './context/RightsContext.jsx'
import { applyFont, getSavedFont } from './fonts.js'
import { applyAnim, getAnim, applyStyleMode, getStyleMode, applyEagles, getEagles, getAutoDark, isNightNow, applyCardDepth, getCardDepth, applyBoxAnim, getBoxAnim, saveBoxAnim, applyCardCorner, getCardCorner, applyInputStyle, getInputStyle, applyToggleStyle, getToggleStyle, applySidebarGlow, getSidebarGlow, getColorMode, saveColorMode, systemPrefersDark } from './prefs.js'
import { applyAccent, getAccent } from './accent.js'

export default function App() {
  const { auth } = useAuth()
  const [theme, setTheme] = useState(() => {
    const mode = getColorMode()
    if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
    // Auto-dark (evening) only applies to a fixed light/dark preference, not to system mode.
    if (getAutoDark()) return isNightNow() ? 'dark' : 'light'
    return mode // 'light' | 'dark'
  })

  // Apply the saved font + animation preference once on startup.
  useEffect(() => {
    applyFont(getSavedFont())
    applyAnim(getAnim())
    applyStyleMode(getStyleMode())
    applyEagles(getEagles())
    applyCardDepth(getCardDepth())
    applyCardCorner(getCardCorner())
    // One-time reset: force the dashboard box "slide-show" animation back ON for any browser
    // that had it turned off. Runs once per browser; the Settings toggle still works afterwards.
    if (!localStorage.getItem('att_boxanim_default_on')) {
      saveBoxAnim(true)
      localStorage.setItem('att_boxanim_default_on', '1')
    }
    applyBoxAnim(getBoxAnim())
    applyInputStyle(getInputStyle())
    applyToggleStyle(getToggleStyle())
    applySidebarGlow(getSidebarGlow())
    applyAccent(getAccent())
  }, [])

  // Auto dark mode: flip the theme when the 6 PM / 6 AM boundary is crossed.
  // Only acts on the transition, so a manual toggle in between is respected
  // until the next boundary.
  useEffect(() => {
    let wasNight = isNightNow()
    const iv = setInterval(() => {
      if (!getAutoDark()) return
      const night = isNightNow()
      if (night !== wasNight) { wasNight = night; setTheme(night ? 'dark' : 'light') }
    }, 60 * 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('att_theme', theme)
  }, [theme])

  // Follow the OS colour when in "system / Use my Windows mode".
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = () => { if (getColorMode() === 'system') setTheme(mq.matches ? 'dark' : 'light') }
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange)
    return () => { mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange) }
  }, [])

  // Top-bar / login toggle → explicit light/dark (leaves "system" only via Settings).
  const toggleTheme = () => setTheme((t) => { const next = t === 'dark' ? 'light' : 'dark'; saveColorMode(next); return next })

  // Settings colour picker: 'light' | 'dark' | 'system'.
  const setThemeMode = (mode) => {
    saveColorMode(mode)
    setTheme(mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode)
  }

  return auth ? (
    <RightsProvider>
      <Dashboard theme={theme} toggleTheme={toggleTheme} setThemeMode={setThemeMode} />
    </RightsProvider>
  ) : (
    <Login theme={theme} toggleTheme={toggleTheme} />
  )
}
