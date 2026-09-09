import { useEffect, useState } from 'react'
import { X } from './icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Snake from './games/Snake.jsx'
import Pong from './games/Pong.jsx'
import Breakout from './games/Breakout.jsx'
import DinoJump from './games/DinoJump.jsx'
import MemoryMatch from './games/MemoryMatch.jsx'
import TicTacToe from './games/TicTacToe.jsx'

const GAMES = [
  { key: 'snake', name: 'Snake', emoji: '🐍', comp: Snake, how: 'Arrow keys / WASD to move' },
  { key: 'pong', name: 'Ping Ball', emoji: '🏓', comp: Pong, how: 'Up / Down or mouse' },
  { key: 'breakout', name: 'Brick Breaker', emoji: '🧱', comp: Breakout, how: 'Left / Right or mouse' },
  { key: 'dino', name: 'Space Jump', emoji: '🦖', comp: DinoJump, how: 'Spacebar to jump' },
  { key: 'memory', name: 'Memory Match', emoji: '🧠', comp: MemoryMatch, how: 'Flip & match the pairs' },
  { key: 'ttt', name: 'Tic-Tac-Toe', emoji: '⭕', comp: TicTacToe, how: 'Beat the computer' },
]

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function BreakZone({ onClose }) {
  const { auth } = useAuth()
  const userName = auth?.displayName || auth?.username || 'there'
  const [stage, setStage] = useState('confirm') // confirm | setup | hub | play
  const [minutes, setMinutes] = useState(10)
  const [remaining, setRemaining] = useState(0) // seconds left
  const [game, setGame] = useState(null)

  // Session countdown — runs once the session has started (hub/play). Auto-closes at 0.
  useEffect(() => {
    if (stage !== 'hub' && stage !== 'play') return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(id); onClose(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const startSession = () => {
    const m = Math.max(1, Math.min(180, Math.round(Number(minutes) || 10)))
    setRemaining(m * 60)
    setStage('hub')
  }

  const inSession = stage === 'hub' || stage === 'play'
  const Selected = game?.comp

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-3xl h-[88vh] rounded-2xl border border-white/15 bg-[#0d0f18] text-slate-100 flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111522]">
          <span className="text-lg font-bold flex items-center gap-2">🎮 Break Zone</span>
          {inSession && (
            <span className={`ml-1 text-sm font-bold flex items-center gap-1 ${remaining <= 60 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>⏳ {fmt(remaining)}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {stage === 'play' && (
              <button onClick={() => { setGame(null); setStage('hub') }} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-bold">← Games</button>
            )}
            <button onClick={onClose} title="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {stage === 'confirm' && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-5 p-8">
              <div className="text-3xl font-extrabold text-amber-300">Hey {userName}! 👋</div>
              <div className="text-6xl">🧘</div>
              <div>
                <h3 className="text-2xl font-bold">Do you want to take a relax break?</h3>
                <p className="text-slate-400 mt-2">Step away for a few minutes, play a quick game, and recharge.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/5">Not now</button>
                <button onClick={() => setStage('setup')} className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-300">Yes, let's relax →</button>
              </div>
            </div>
          )}

          {stage === 'setup' && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-5 p-8">
              <div className="text-5xl">⏱️</div>
              <div>
                <h3 className="text-xl font-bold">How long is your break?</h3>
                <p className="text-slate-400 mt-1 text-sm">The Break Zone closes automatically when the time is up.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setMinutes((m) => Math.max(1, Number(m) - 1))} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-xl font-bold">−</button>
                <input type="number" min="1" max="180" value={minutes} onChange={(e) => setMinutes(e.target.value)}
                  className="w-24 text-center text-2xl font-bold rounded-xl border border-white/15 bg-[#1e2235] text-white px-2 py-2 outline-none" />
                <button onClick={() => setMinutes((m) => Math.min(180, Number(m) + 1))} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-xl font-bold">+</button>
                <span className="text-slate-400 font-bold ml-1">minutes</span>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 30].map((m) => (
                  <button key={m} onClick={() => setMinutes(m)} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${Number(minutes) === m ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/15'}`}>{m}m</button>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStage('confirm')} className="px-5 py-2.5 rounded-xl border border-white/15 text-slate-300 font-bold hover:bg-white/5">← Back</button>
                <button onClick={startSession} className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-300">Start break</button>
              </div>
            </div>
          )}

          {stage === 'hub' && (
            <div className="p-5">
              <div className="text-sm text-slate-400 mb-3">Pick a game — your {fmt(remaining)} break is running.</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GAMES.map((g) => (
                  <button key={g.key} onClick={() => { setGame(g); setStage('play') }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-[#161c2b] hover:border-amber-400/60 hover:bg-[#1b2233] transition-colors">
                    <span className="text-4xl">{g.emoji}</span>
                    <span className="font-bold">{g.name}</span>
                    <span className="text-[11px] text-slate-400 text-center">{g.how}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === 'play' && Selected && (
            <div className="relative w-full h-full min-h-[60vh]">
              <div className="w-full h-full flex items-center justify-center p-3">
                <Selected />
              </div>
              {remaining <= 60 && (
                <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-bold shadow-lg animate-pulse">
                  Closing in {fmt(remaining)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
