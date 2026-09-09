import { useEffect, useRef, useState } from 'react'
import { getHappyHours } from '../api/masters.js'

const THRESHOLDS = [15, 10, 5] // minutes before start
const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const to12h = (t) => {
  if (!t) return ''
  const [h, m] = String(t).split(':')
  let hh = Number(h)
  if (Number.isNaN(hh)) return t
  const ap = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `${hh}:${m ?? '00'} ${ap}`
}

// Watches active Happy Hours: pops a reminder 15/10/5 min before each one starts,
// AND keeps a notification list (bell) of today's upcoming ones. Entries auto-erase
// once their start time passes.
export default function HappyHourReminder() {
  const [items, setItems] = useState([])
  const [toasts, setToasts] = useState([])
  const [open, setOpen] = useState(false)
  const [, forceTick] = useState(0) // bump to recompute "upcoming" each tick
  const fired = useRef(new Set())

  useEffect(() => {
    const load = () => getHappyHours().then((r) => setItems(r || [])).catch(() => {})
    load()
    const iv = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      forceTick((n) => n + 1) // refresh the "upcoming" list (drops past events)
      const now = new Date()
      const today = iso(now)
      for (const hh of items) {
        if (!hh.isActive || !hh.startTime) continue
        if (!hh.eventDate || String(hh.eventDate).slice(0, 10) !== today) continue
        const [h, m] = String(hh.startTime).split(':')
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(h), Number(m || 0), 0)
        const mins = (start - now) / 60000
        if (mins <= 0) continue
        for (const t of THRESHOLDS) {
          const key = `${hh.happyHourId}-${t}`
          if (mins <= t && mins > t - 1 && !fired.current.has(key)) {
            fired.current.add(key)
            const toast = { id: key, title: hh.title, mins: t, place: hh.locationAddress }
            setToasts((list) => [...list, toast])
            setTimeout(() => setToasts((list) => list.filter((x) => x.id !== key)), 12000)
            if ('Notification' in window && Notification.permission === 'granted') {
              try { new Notification(`🎉 ${hh.title} in ${t} min`, { body: hh.locationAddress || '' }) } catch { /* noop */ }
            }
          }
        }
      }
    }
    tick()
    const iv = setInterval(tick, 30 * 1000)
    return () => clearInterval(iv)
  }, [items])

  // Today's upcoming happy hours (not started yet) — past ones auto-drop off.
  const now = new Date()
  const today = iso(now)
  const upcoming = items
    .filter((hh) => hh.isActive && hh.startTime && hh.eventDate && String(hh.eventDate).slice(0, 10) === today)
    .map((hh) => {
      const [h, m] = String(hh.startTime).split(':')
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(h), Number(m || 0), 0)
      return { hh, start, mins: Math.round((start - now) / 60000) }
    })
    .filter((x) => x.mins > 0)
    .sort((a, b) => a.start - b.start)

  return (
    <>
      {/* Reminder toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-24 right-5 z-[55] flex flex-col gap-2 w-[92vw] max-w-xs">
          {toasts.map((t) => (
            <div key={t.id} className="welcome-pop flex items-start gap-3 rounded-2xl border border-teal-400/30 bg-[#161c2b] text-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.5)] px-4 py-3">
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-lg">🎉</div>
              <div className="min-w-0">
                <div className="font-bold leading-tight">{t.title} in {t.mins} min</div>
                {t.place && <div className="text-[12px] text-slate-400 truncate">{t.place}</div>}
              </div>
              <button onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))} className="ml-auto shrink-0 w-6 h-6 rounded-lg text-slate-400 hover:bg-white/10 font-bold">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Notification bell — appears only when there are upcoming happy hours today */}
      {upcoming.length > 0 && (
        <div className="fixed bottom-5 left-5 z-40">
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute bottom-16 left-0 z-50 w-72 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] shadow-2xl">
                <div className="px-4 py-3 bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold text-sm flex items-center gap-2">🎉 Happy Hours — Today</div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {upcoming.map(({ hh, mins }) => (
                    <div key={hh.happyHourId} className="px-4 py-2.5">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{hh.title}</div>
                      <div className="text-[12px] text-teal-600 dark:text-teal-400 font-bold">{to12h(hh.startTime)} · in {mins} min</div>
                      {hh.locationAddress && <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{hh.locationAddress}</div>}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-white/10">Entries erase automatically once the time passes.</div>
              </div>
            </>
          )}
          <button onClick={() => setOpen((o) => !o)} title="Happy Hours today"
            className="relative help-bot-launch w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-2xl bg-gradient-to-br from-teal-400 to-cyan-600 ring-4 ring-teal-400/30 hover:scale-105 transition-transform">
            🎉
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-white dark:border-[#0d0f18]">{upcoming.length}</span>
          </button>
        </div>
      )}
    </>
  )
}
