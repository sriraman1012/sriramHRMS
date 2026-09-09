import { useEffect, useRef, useState } from 'react'
import { getHome } from '../api/dashboard.js'
import { MANUAL_ANSWER } from '../userManual.js'
import SendButton from './SendButton.jsx'

const now = new Date()
const YEAR = now.getFullYear()
const MONTH = now.getMonth() + 1
const isoToday = `${YEAR}-${String(MONTH).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const STATUS = { A: 'Absent', L: 'Leave', HD: 'Half Day' }
const fmtT = (t) => (t ? String(t).slice(0, 5) : '')

// Static "how-to" answers.
const HOWTO = {
  attendance: '📝 Enter attendance:\n1. Sidebar → Attendance → Attendance Entry.\n2. Choose Month, Year, Department.\n3. Click a code (P / A / L / HD / H / WO) in the palette.\n4. Click the day cells for each employee.\n5. Click Save.',
  leave: '🏖️ Register a leave:\n1. Attendance → Leave Register → "Register Leave".\n2. Pick employee, leave type, From & To dates, reason.\n3. Save — it auto-marks attendance as Leave.',
  permission: '⏱️ Add hourly permission:\n1. Attendance → Hourly Permission → "Add Permission".\n2. Pick employee, date, From & To time, reason.\n3. Save.',
  chat: '💬 Open the chat:\n1. Sidebar → Chat Messages.\n2. Pick a person from the list.\n3. Type a message and press send — or hold 🎤 to record a voice note.',
  reports: '📊 Reports:\nSidebar → Reports → Employee Summary / Attendance Detail / Leave Report / Permission Report. Filter by Month·Year·Department and Export Excel.',
  balance: '💰 Balance Carry Forward:\nAttendance → Balance Carry Forward. It auto-computes each employee\'s carry-forward; enter a manual Deduction + Remarks and Save.\n(Present Onsite (PO) counts the same as Present here.)',
  onsite: '📍 Present Onsite (PO):\n1. Attendance → Attendance Entry.\n2. Click the "PO · Present Onsite" code in the palette.\n3. Click the employee\'s day cell — a popup asks for the customer / onsite place. Type it and click Set Onsite.\n4. Click Save.\nThe Dashboard shows an "Onsite" box (click it for the list), and Reports → Onsite Report lists who went where.',
  happyhours: '🎉 Happy Hours:\n1. Attendance → Happy Hours → "Add Happy Hours".\n2. Enter Title, pick the Day, Start & End time, and the Location Address; set Active.\n3. Save.\nSee them all under Reports → Happy Hours Report (Export Excel / PDF).',
  breakzone: '🎮 Take a relax break & play games:\nNavigation: Home → Top bar → the yellow "BREAK ▶" button (also in Chat Messages → "Take a break").\n1. Click BREAK → confirm "Yes, let\'s relax".\n2. Set your break length (default 10 minutes, editable).\n3. Pick a game: Snake, Ping Ball, Brick Breaker, Space Jump, Memory Match, or Tic-Tac-Toe.\n4. In the last minute a countdown shows in the corner and the Break Zone closes automatically.',
  trend: '📈 Present vs Absent trend chart:\nNavigation: Home (Dashboard) → the "Present vs Absent" card.\n• Use the View-by dropdown (Date / Month / Year) and pick the Month / Year.\n• Hover any point on the line for the exact Present / Absent counts.',
  forward: '↪️ Forward a chat message:\nNavigation: Chat Messages → open a chat → hover a message → ⋮ → Forward → tick one or more contacts → Forward.',
  chatdeletelog: '🗑️ Chat Delete Log:\nNavigation: Reports → Chat Delete Log.\nIt lists every chat deletion (message deleted / chat cleared / chat purged) with who did it, when, the participants, and the detail. Filter by date and Export Excel / PDF.',
  appearance: '🎨 Appearance & dark mode:\n• Dark / light — the round toggle in the Top bar (or Settings → Appearance).\n• Settings has live-preview options: Login Page Style, Input Field Style, Toggle Switch Style, Sidebar Glow, Display Style, Accent Colour, Card Depth.\n• Dashboard boxes slide in from different sides (a "slide-show" on each load — toggle it under Settings → Animations). Hover any box for a rotating colour border; its thickness follows the Card Depth setting.',
  quickentry: '⚡ Quick-open Attendance Entry:\nNavigation: Dashboard → the purple "Attendance" button (start of the filter row).\n• When you open any other module it moves up to the Top bar (left of the BREAK button), so you can jump to Attendance Entry from anywhere.\n• Opening Attendance Entry auto-collapses the sidebar (like Chat) for more room — click the ☰ menu button to expand it again.',
  tooltip: 'ℹ️ Hover tips in Attendance Entry:\nNavigation: Attendance → Attendance Entry.\n• Hover a PO (Present Onsite) cell → shows the customer / onsite place.\n• Hover a Holiday date (the amber column) → shows the holiday name.',
  travel: '🧳 Travel Allowance:\nNavigation: Attendance → Travel Allowance.\n1. New Advance → pick employee, client, location, travel dates (Onsite Days auto-calculated), advance amount.\n2. Enter the expense breakdown (Bus, Train, Flight, Bike, Taxi, Hotel, Food, Other) — Total & Balance auto-compute (balance + = employee returns, − = office reimburses).\n3. Optionally upload supporting bills (PDF/image) + Remarks; Save.\n4. A manager Approves ✓ / Rejects ⊘ from the list. Click 👁 View to see the details and open the attached documents.\nReport: Reports → Travel Allowance Report (Export Excel / PDF).',
}

// Live-data answers.
async function todayLeave() {
  const d = await getHome(YEAR, MONTH, '', isoToday)
  const list = d.absentLeave || []
  if (!list.length) return '✅ No one is absent / on leave today.'
  return "Today's absent / leave:\n" + list.map((x) => `• ${x.name} — ${STATUS[x.statusCode] || x.statusCode}`).join('\n')
}
async function todayPermission() {
  const d = await getHome(YEAR, MONTH, '', isoToday)
  const list = d.permissionToday || []
  if (!list.length) return '✅ No hourly permissions today.'
  return "Today's hourly permission:\n" + list.map((x) => `• ${x.name} — ${fmtT(x.fromTime)}–${fmtT(x.toTime)} (${x.hours}h)`).join('\n')
}
async function todayPresent() {
  const d = await getHome(YEAR, MONTH, '', isoToday)
  return `👥 ${d.summary.presentToday} present of ${d.summary.totalEmployees} employees today.`
}

const SUGGESTIONS = [
  { q: 'How to enter attendance?', a: () => HOWTO.attendance },
  { q: 'Who is on leave today?', a: todayLeave },
  { q: 'Who is on permission today?', a: todayPermission },
  { q: 'Who is present today?', a: todayPresent },
  { q: 'How to register a leave?', a: () => HOWTO.leave },
  { q: 'How to add hourly permission?', a: () => HOWTO.permission },
  { q: 'How to mark Present Onsite?', a: () => HOWTO.onsite },
  { q: 'Quick-open Attendance Entry?', a: () => HOWTO.quickentry },
  { q: 'Onsite / Holiday hover info?', a: () => HOWTO.tooltip },
  { q: 'What is Happy Hours?', a: () => HOWTO.happyhours },
  { q: 'How to take a break / play games?', a: () => HOWTO.breakzone },
  { q: 'Present vs Absent chart?', a: () => HOWTO.trend },
  { q: 'How to open the chat?', a: () => HOWTO.chat },
  { q: 'How to forward a chat message?', a: () => HOWTO.forward },
  { q: 'What is Chat Delete Log?', a: () => HOWTO.chatdeletelog },
  { q: 'What is Travel Allowance?', a: () => HOWTO.travel },
  { q: 'How to see reports?', a: () => HOWTO.reports },
  { q: 'Change appearance / dark mode?', a: () => HOWTO.appearance },
  { q: 'What is Balance Carry Forward?', a: () => HOWTO.balance },
  { q: 'Do you want the user manual?', a: () => MANUAL_ANSWER },
  { q: 'Who built this software?', a: () => '👨‍💻 This software was built by Sri.' },
]

// Keyword rules for free-text questions — specific (2-word) rules first.
const RULES = [
  { kw: ['leave', 'today'], a: todayLeave },
  { kw: ['leave', 'who'], a: todayLeave },
  { kw: ['permission', 'today'], a: todayPermission },
  { kw: ['permission', 'who'], a: todayPermission },
  { kw: ['present', 'today'], a: todayPresent },
  { kw: ['present', 'who'], a: todayPresent },
  { kw: ['absent'], a: todayLeave },
  { kw: ['attendance'], a: () => HOWTO.attendance },
  { kw: ['leave'], a: () => HOWTO.leave },
  { kw: ['permission'], a: () => HOWTO.permission },
  { kw: ['chat'], a: () => HOWTO.chat },
  { kw: ['message'], a: () => HOWTO.chat },
  { kw: ['report'], a: () => HOWTO.reports },
  { kw: ['export'], a: () => HOWTO.reports },
  { kw: ['balance'], a: () => HOWTO.balance },
  { kw: ['carry'], a: () => HOWTO.balance },
  { kw: ['onsite'], a: () => HOWTO.onsite },
  { kw: ['present', 'onsite'], a: () => HOWTO.onsite },
  { kw: ['po'], a: () => HOWTO.onsite },
  { kw: ['happy'], a: () => HOWTO.happyhours },
  { kw: ['happy', 'hour'], a: () => HOWTO.happyhours },
  { kw: ['delete', 'log'], a: () => HOWTO.chatdeletelog },
  { kw: ['travel', 'report'], a: () => HOWTO.travel },
  { kw: ['travel'], a: () => HOWTO.travel },
  { kw: ['allowance'], a: () => HOWTO.travel },
  { kw: ['reimburse'], a: () => HOWTO.travel },
  { kw: ['break'], a: () => HOWTO.breakzone },
  { kw: ['relax'], a: () => HOWTO.breakzone },
  { kw: ['game'], a: () => HOWTO.breakzone },
  { kw: ['play'], a: () => HOWTO.breakzone },
  { kw: ['forward'], a: () => HOWTO.forward },
  { kw: ['chart'], a: () => HOWTO.trend },
  { kw: ['trend'], a: () => HOWTO.trend },
  { kw: ['graph'], a: () => HOWTO.trend },
  { kw: ['dark', 'mode'], a: () => HOWTO.appearance },
  { kw: ['theme'], a: () => HOWTO.appearance },
  { kw: ['glow'], a: () => HOWTO.appearance },
  { kw: ['slide'], a: () => HOWTO.appearance },
  { kw: ['animation'], a: () => HOWTO.appearance },
  { kw: ['quick'], a: () => HOWTO.quickentry },
  { kw: ['shortcut'], a: () => HOWTO.quickentry },
  { kw: ['collapse'], a: () => HOWTO.quickentry },
  { kw: ['tooltip'], a: () => HOWTO.tooltip },
  { kw: ['hover'], a: () => HOWTO.tooltip },
  { kw: ['holiday'], a: () => HOWTO.tooltip },
  { kw: ['manual'], a: () => MANUAL_ANSWER },
  { kw: ['guide'], a: () => MANUAL_ANSWER },
  { kw: ['help', 'document'], a: () => MANUAL_ANSWER },
  { kw: ['who', 'built'], a: () => '👨‍💻 This software was built by Sri.' },
  { kw: ['who', 'build'], a: () => '👨‍💻 This software was built by Sri.' },
  { kw: ['who', 'made'], a: () => '👨‍💻 This software was built by Sri.' },
  { kw: ['who', 'developed'], a: () => '👨‍💻 This software was built by Sri.' },
  { kw: ['developer'], a: () => '👨‍💻 This software was built by Sri.' },
]
function matchAnswer(text) {
  const t = text.toLowerCase()
  for (const r of RULES) if (r.kw.every((w) => t.includes(w))) return r.a
  return null
}

export default function HelpBot() {
  const [open, setOpen] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [messages, setMessages] = useState([{ role: 'bot', text: "Hi! I'm Unibot ✨ — may I help you? Tap a question below." }])
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => { const t = setTimeout(() => setShowHint(false), 8000); return () => clearTimeout(t) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, open])

  const runAnswer = async (qText, ansFn) => {
    if (busy) return
    setMessages((m) => [...m, { role: 'user', text: qText }])
    setBusy(true)
    try {
      const ans = await ansFn()
      setMessages((m) => [...m, { role: 'bot', text: ans }])
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I could not fetch that right now.' }])
    } finally { setBusy(false) }
  }
  const ask = (s) => runAnswer(s.q, s.a)
  const sendText = () => {
    const t = input.trim()
    if (!t || busy) return
    setInput('')
    const fn = matchAnswer(t) || (() => "I'm not sure about that one yet 🤔. Try a suggestion below, or ask things like \"who is on leave today\", \"who is on permission today\", or \"how to enter attendance\".")
    runAnswer(t, fn)
  }

  return (
    <>
      {/* Launcher (bottom-right, does not affect layout) */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
          {showHint && (
            <div className="hidden sm:block rounded-full bg-white dark:bg-[#1e2235] border border-slate-200 dark:border-white/15 shadow-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              May I help you?
            </div>
          )}
          <button onClick={() => { setOpen(true); setShowHint(false) }} title="Ask Unibot"
            className="help-bot-launch hover:scale-105 transition-transform">
            <span className="bot-loader"><span className="circle" /></span>
          </button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <>
        {/* Click anywhere outside the panel to close */}
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
        <div className="fixed z-40 flex flex-col overflow-hidden border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] shadow-2xl
          inset-x-2 bottom-2 h-[80vh] rounded-2xl
          sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[92vw] sm:max-w-sm sm:h-[70vh] sm:max-h-[560px]">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
            <span className="bot-loader mini"><span className="circle" /></span>
            <div className="flex-1 min-w-0"><div className="font-bold leading-tight">Unibot</div><div className="text-[11px] opacity-90">Your attendance assistant</div></div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/15 text-lg font-bold">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-[#0d0f18]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-[#1e2235] text-slate-800 dark:text-slate-100 rounded-bl-sm'}`}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="bg-white dark:bg-[#1e2235] rounded-2xl px-3 py-2 text-sm text-slate-400">typing…</div></div>}
            <div ref={endRef} />
          </div>

          {/* Suggested questions */}
          <div className="px-2 pt-2 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {SUGGESTIONS.map((s) => (
              <button key={s.q} onClick={() => ask(s)} disabled={busy}
                className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-white/15 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-500/10 disabled:opacity-50">
                {s.q}
              </button>
            ))}
          </div>

          {/* Free-text input */}
          <div className="p-2 bg-white dark:bg-[#161925] flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendText() }}
              placeholder="Type your question…"
              className="flex-1 rounded-full border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-4 py-2 text-sm outline-none focus:border-blue-500" />
            <SendButton onClick={sendText} />
          </div>
        </div>
        </>
      )}
    </>
  )
}
