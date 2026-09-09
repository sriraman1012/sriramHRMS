import { useState } from 'react'
import { getSpecialDay, getUpcoming } from '../specialDays.js'

const EV_KEY = 'att_events'
const loadEvents = () => { try { return JSON.parse(localStorage.getItem(EV_KEY) || '{}') } catch { return {} } }
const saveEvents = (e) => localStorage.setItem(EV_KEY, JSON.stringify(e))
const dkey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Today's special day + a mini calendar with personal notes/events.
export default function SpecialDay({ collapsed }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('calendar')
  const [events, setEvents] = useState(loadEvents)
  const now = new Date()
  const today = getSpecialDay(now)
  const upcoming = getUpcoming(now, 10)
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const feat = today.special ? today : upcoming[0]
  const inDays = (n) => (n === 1 ? 'tomorrow' : `in ${n} days`)
  const todayEvents = events[dkey(now)] || []

  const Card = collapsed ? (
    <button onClick={() => setOpen(true)} title={`${dateLabel} · ${today.special ? today.title : (feat ? 'Upcoming: ' + feat.title : '')}`}
      className="mx-auto mb-2 w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex flex-col items-center justify-center leading-none hover:bg-white/10">
      <span className="text-[9px] font-bold text-red-400 uppercase">{now.toLocaleDateString('en-US', { month: 'short' })}</span>
      <span className="text-sm font-bold text-slate-100">{now.getDate()}</span>
    </button>
  ) : (
    <button onClick={() => setOpen(true)} className="m-2 w-[calc(100%-1rem)] text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{dateLabel}</span>
        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${today.special ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>{today.special ? 'Today' : 'Upcoming'}</span>
      </div>
      <div className="mt-1.5 flex gap-2">
        <span className={`w-1 rounded-full shrink-0 ${today.special ? 'bg-red-500' : 'bg-blue-500'}`} />
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold text-slate-100 leading-snug">{feat?.title}</div>
          <div className="text-[11px] text-slate-400 leading-snug">{feat?.sub}</div>
          {!today.special && feat && <div className="text-[10px] text-slate-500 mt-0.5">{feat.dateLabel} · {inDays(feat.daysUntil)}</div>}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] font-bold text-blue-400">Calendar &amp; events →</span>
        {todayEvents.length > 0 && <span className="text-[9px] font-bold text-emerald-300">📌 {todayEvents.length}</span>}
      </div>
    </button>
  )

  return (
    <>
      {Card}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 text-slate-800 dark:text-slate-100" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[88vh] flex flex-col text-slate-800 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-bold">📅 Calendar &amp; Events</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
            </div>
            <div className="px-5 pt-3">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden text-sm">
                <button onClick={() => setTab('calendar')} className={`px-4 py-1.5 font-bold ${tab === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Calendar</button>
                <button onClick={() => setTab('special')} className={`px-4 py-1.5 font-bold ${tab === 'special' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Special Days</button>
              </div>
            </div>
            <div className="overflow-y-auto p-5 pt-3">
              {tab === 'calendar'
                ? <CalendarView events={events} setEvents={(e) => { setEvents(e); saveEvents(e) }} />
                : <SpecialList today={today} upcoming={upcoming} inDays={inDays} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CalendarView({ events, setEvents }) {
  const today = new Date()
  const [y, setY] = useState(today.getFullYear())
  const [m, setM] = useState(today.getMonth()) // 0-11
  const [sel, setSel] = useState(dkey(today))
  const [text, setText] = useState('')

  const days = new Date(y, m + 1, 0).getDate()
  const firstDow = new Date(y, m, 1).getDay()
  const step = (delta) => { const d = new Date(y, m + delta, 1); setY(d.getFullYear()); setM(d.getMonth()) }

  const selDate = new Date(`${sel}T00:00:00`)
  const selSpecial = getSpecialDay(selDate)
  const selEvents = events[sel] || []
  const addEvent = () => { const t = text.trim(); if (!t) return; const e = { ...events, [sel]: [...(events[sel] || []), t] }; setEvents(e); setText('') }
  const removeEvent = (i) => { const arr = (events[sel] || []).filter((_, x) => x !== i); const e = { ...events }; if (arr.length) e[sel] = arr; else delete e[sel]; setEvents(e) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => step(-1)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-bold">‹</button>
        <div className="font-bold text-sm">{MONTHS[m]} {y}</div>
        <button onClick={() => step(1)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WD.map((w, i) => <div key={i} className="text-[10px] font-bold text-slate-400 py-1">{w}</div>)}
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const date = new Date(y, m, d)
          const key = dkey(date)
          const isToday = key === dkey(today)
          const isSel = key === sel
          const hasEv = (events[key] || []).length > 0
          const isSpecial = getSpecialDay(date).special
          return (
            <button key={d} onClick={() => setSel(key)}
              className={`relative h-9 rounded-lg text-sm font-bold ${isSel ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              {d}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                {isSpecial && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-red-500'}`} />}
                {hasEv && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-emerald-500'}`} />}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected day */}
      <div className="mt-4 border-t border-slate-100 dark:border-white/10 pt-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{selDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        {selSpecial.special && (
          <div className="mt-1.5 flex gap-2"><span className="w-1 rounded-full bg-red-500 shrink-0" /><div><div className="font-bold text-sm">{selSpecial.title}</div><div className="text-xs text-slate-500 dark:text-slate-400">{selSpecial.sub}</div></div></div>
        )}
        <div className="mt-2 space-y-1">
          {selEvents.length === 0 ? <div className="text-xs text-slate-400">No notes/events for this day.</div>
            : selEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 rounded-lg px-2 py-1.5 text-sm">
                <span className="text-emerald-500">📌</span><span className="flex-1 break-words">{ev}</span>
                <button onClick={() => removeEvent(i)} className="text-red-500 font-bold px-1">×</button>
              </div>
            ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEvent()} placeholder="Add a note / event…"
            className="flex-1 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
          <button onClick={addEvent} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Add</button>
        </div>
      </div>
    </div>
  )
}

function SpecialList({ today, upcoming, inDays }) {
  const now = new Date()
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Today · {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      {today.special
        ? <div className="mt-1.5 flex gap-2"><span className="w-1 rounded-full bg-red-500 shrink-0" /><div><div className="font-bold">{today.title}</div><div className="text-sm text-slate-500 dark:text-slate-400">{today.sub}</div></div></div>
        : <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">No special observance today. {today.sub}</div>}
      <div className="pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Upcoming</div>
      {upcoming.map((u) => (
        <div key={u.mmdd} className="py-2.5 flex items-start gap-3 border-t border-slate-100 dark:border-white/5">
          <div className="w-12 shrink-0 text-center"><div className="text-[10px] font-bold text-red-500 uppercase">{u.dateLabel.split(' ')[0]}</div><div className="text-lg font-bold leading-none">{u.dateLabel.split(' ')[1]}</div><div className="text-[9px] text-slate-400">{u.weekday}</div></div>
          <div className="min-w-0 flex-1"><div className="font-bold text-[13px]">{u.title}</div><div className="text-[12px] text-slate-500 dark:text-slate-400">{u.sub}</div></div>
          <span className="shrink-0 text-[10px] font-bold text-slate-400 mt-0.5">{inDays(u.daysUntil)}</span>
        </div>
      ))}
    </div>
  )
}
