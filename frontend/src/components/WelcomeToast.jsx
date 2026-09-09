import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// A brief "Welcome back" card shown once per login session, greeting by name.
export default function WelcomeToast() {
  const { auth } = useAuth()
  const name = auth?.displayName || auth?.username || 'there'
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!auth) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 3000) // visible ~3 seconds
    return () => clearTimeout(t)
  }, [auth])

  if (!show) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92vw] max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#161c2b] text-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.5)] px-4 py-3 welcome-pop">
        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-xl">✨</div>
        <div className="min-w-0">
          <div className="font-bold leading-tight truncate">Welcome back, {name}!</div>
          <div className="text-[12px] text-slate-400">Great to see you again</div>
        </div>
        <button onClick={() => setShow(false)} className="ml-auto shrink-0 w-7 h-7 rounded-lg text-slate-400 hover:bg-white/10 text-lg font-bold">×</button>
      </div>
    </div>
  )
}
