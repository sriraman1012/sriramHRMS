import { useState } from 'react'
import { getCritters } from '../prefs.js'

// A "good thing for the day" — a positive/motivational line that rotates daily.
const QUOTES = [
  'Every day is a fresh start. Make today count! 🌅',
  'Small steps every day lead to big results. Keep going! 🚀',
  'Your attitude determines your direction. Stay positive! 😊',
  'Hard work today builds a brighter tomorrow. 💪',
  'Believe in yourself — you are capable of amazing things. ⭐',
  'Progress, not perfection. You are doing great! 🌱',
  'A grateful heart is a magnet for good things. 🙏',
  'Difficulties often prepare ordinary people for an extraordinary destiny. ✨',
  'Do something today that your future self will thank you for. 🎯',
  'Kindness costs nothing but means everything. Spread it! 💛',
  'You are stronger than you think. Keep pushing forward! 🔥',
  'Focus on the good, and more good will come your way. 🌞',
  'Success is the sum of small efforts repeated day in and day out. 📈',
  'The best time to start was yesterday. The next best time is now. ⏳',
  'Stay patient and trust your journey. Great things take time. 🌸',
  'A positive mind finds opportunity in every difficulty. 🌈',
  'Be the reason someone smiles today. 😄',
  'Dream big, work hard, stay focused. 🏆',
  'Every accomplishment starts with the decision to try. 🌟',
  'Today is a good day to have a good day. ☀️',
  'Your only limit is you. Break through it! 🧗',
  'Consistency is what transforms average into excellence. 🎖️',
  'Good things come to those who work for them. 🛠️',
  'Count your blessings, not your problems. 🍀',
  'One positive thought in the morning can change your whole day. 🌤️',
  'Discipline is choosing between what you want now and what you want most. 🎯',
  'You did not come this far to only come this far. Keep going! 🏁',
  'The secret of getting ahead is getting started. 🚦',
  'Happiness is not by chance, but by choice. Choose it today! 🌼',
  'Great work is done by people who are not afraid to be great. 👑',
  'Take a deep breath — you have got this. 🌬️',
]

// Blossoms that fall through the box (fixed configs so they don't re-randomize).
const PETALS = [
  { e: '🌸', left: '8%', dur: '4.2s', delay: '0s', sway: '14px' },
  { e: '🌼', left: '20%', dur: '5.1s', delay: '0.8s', sway: '-10px' },
  { e: '✨', left: '32%', dur: '3.6s', delay: '1.4s', sway: '8px' },
  { e: '🌺', left: '45%', dur: '4.8s', delay: '0.3s', sway: '-16px' },
  { e: '🍃', left: '57%', dur: '5.4s', delay: '1.1s', sway: '12px' },
  { e: '🌸', left: '68%', dur: '3.9s', delay: '2.0s', sway: '-8px' },
  { e: '✨', left: '78%', dur: '4.5s', delay: '0.6s', sway: '10px' },
  { e: '🌼', left: '88%', dur: '5.0s', delay: '1.7s', sway: '-12px' },
  { e: '🌷', left: '14%', dur: '4.6s', delay: '2.3s', sway: '10px' },
]

// One-time celebration burst near the top when the panel opens.
const BURSTS = [
  { e: '🎉', left: '18%', top: '30%', delay: '0s' },
  { e: '💥', left: '50%', top: '20%', delay: '0.12s' },
  { e: '✨', left: '78%', top: '32%', delay: '0.24s' },
]

// Little critters that walk/hop around inside the box. Varies by day.
const CRITTERS = ['🐱', '🐰', '🐿️', '🐹', '🐶', '🐦', '🐤', '🐧', '🐣', '🦋', '🐥', '🐭']

const SEEN_KEY = 'att_motiv_seen'

function daySeed() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / 86400000)
}

export default function DailyMotivation() {
  const now = new Date()
  const dayOfYear = daySeed()
  const text = QUOTES[dayOfYear % QUOTES.length]
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const [open, setOpen] = useState(false)
  const [unseen, setUnseen] = useState(() => localStorage.getItem(SEEN_KEY) !== todayIso)

  const funOn = getCritters()
  // Two different critters each day, chosen from the pool.
  const walkers = [
    { e: CRITTERS[dayOfYear % CRITTERS.length], speed: '5.5s', hop: '0.55s', wdelay: '0s', face: 1 },
    { e: CRITTERS[(dayOfYear + 5) % CRITTERS.length], speed: '7s', hop: '0.7s', wdelay: '0.9s', face: -1 },
  ]

  const openPanel = () => {
    setOpen((o) => !o)
    if (unseen) {
      localStorage.setItem(SEEN_KEY, todayIso)
      setUnseen(false)
    }
  }

  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="relative">
      <button onClick={openPanel} title="Today's motivation" className="bell-btn">
        <svg className="bell" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.8 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.5-13.6s2.9-18.2-2.8-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H80.3C106.1 328 120 281.3 120 233.4V200c0-57.4 46.6-104 104-104zm64 352H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7S288 465 288 448z" />
        </svg>
        {unseen && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-[#161925] animate-pulse" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1e2235] shadow-xl z-50 overflow-hidden soft-card">
            <div className="px-4 py-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative z-10">
              <div className="text-xs font-bold uppercase tracking-widest opacity-90">Good Thing of the Day</div>
              <div className="text-[11px] opacity-80 mt-0.5">{dateLabel}</div>
            </div>
            <div className="p-4 pb-10 relative z-10">
              <p className="text-[15px] font-bold leading-relaxed text-slate-700 dark:text-slate-100">{text}</p>
              <p className="text-[11px] text-slate-400 mt-3">A new one appears every day. Have a great day! 💫</p>
            </div>

            {/* Fun layer: blossoms, opening burst, roaming critters */}
            {funOn && (
              <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                {PETALS.map((p, i) => (
                  <span key={i} className="crt-petal" style={{ left: p.left, '--dur': p.dur, '--delay': p.delay, '--sway': p.sway }}>{p.e}</span>
                ))}
                {BURSTS.map((b, i) => (
                  <span key={`b${i}`} className="crt-burst" style={{ left: b.left, top: b.top, '--bdelay': b.delay }}>{b.e}</span>
                ))}
                {walkers.map((w, i) => (
                  <span key={`w${i}`} className="crt-walker" style={{ '--speed': w.speed, '--wdelay': w.wdelay }}>
                    <span style={{ '--hop': w.hop, '--face': w.face }}>{w.e}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
