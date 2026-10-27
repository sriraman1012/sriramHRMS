import { useState, useEffect, useCallback, useRef } from 'react'

// "Tap Away Arrows" — tap an arrow whose straight path to the board edge is clear
// and it flies off. Clear every arrow to win. Puzzles are generated so they are
// ALWAYS solvable: arrows are placed one-by-one only where their path is currently
// clear, so removing them in reverse placement order always works.

const ROWS = 7
const COLS = 6
const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
const GLYPH = { up: '↑', down: '↓', left: '←', right: '→' }
const FLY = { up: 'translateY(-240%)', down: 'translateY(240%)', left: 'translateX(-240%)', right: 'translateX(240%)' }
const BEST_KEY = 'att_game_arrows_best'

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null))

// Is the straight path from (r,c) in `dir` free of other arrows (on `board`)?
function pathClear(board, r, c, dir) {
  const [dr, dc] = DIRS[dir]
  let rr = r + dr, cc = c + dc
  while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) {
    if (board[rr][cc]) return false
    rr += dr; cc += dc
  }
  return true
}

function genPuzzle(target) {
  const board = emptyBoard()
  let placed = 0, guard = 0
  while (placed < target && guard < 800) {
    guard++
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (board[r][c]) continue
    const dirs = Object.keys(DIRS).filter((d) => pathClear(board, r, c, d))
    if (!dirs.length) continue
    const dir = dirs[Math.floor(Math.random() * dirs.length)]
    board[r][c] = { dir, id: `${r}_${c}_${Math.random().toString(36).slice(2, 7)}` }
    placed++
  }
  return board
}

const countArrows = (b) => b.reduce((a, row) => a + row.filter(Boolean).length, 0)

export default function ArrowsPuzzle() {
  const [level, setLevel] = useState(1)
  const [board, setBoard] = useState(() => genPuzzle(14))
  const [moves, setMoves] = useState(0)
  const [leaving, setLeaving] = useState({}) // id -> dir (animating out)
  const [shake, setShake] = useState(null)   // id of a blocked arrow (feedback)
  const [hint, setHint] = useState(null)     // id of a hinted arrow
  const [best, setBest] = useState(null)
  const [won, setWon] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    try { const n = parseInt(localStorage.getItem(BEST_KEY), 10); if (!Number.isNaN(n)) setBest(n) } catch { /* ignore */ }
    return () => { timers.current.forEach(clearTimeout) }
  }, [])

  const remaining = countArrows(board)

  // Win when the last arrow has flown off.
  useEffect(() => {
    if (!won && remaining === 0 && Object.keys(leaving).length === 0 && moves > 0) {
      setWon(true)
      setBest((prev) => {
        if (prev == null || moves < prev) { try { localStorage.setItem(BEST_KEY, String(moves)) } catch { /* ignore */ } return moves }
        return prev
      })
    }
  }, [remaining, leaving, moves, won])

  const newPuzzle = useCallback((lvl) => {
    timers.current.forEach(clearTimeout); timers.current = []
    const target = Math.min(26, 12 + lvl * 2)
    setBoard(genPuzzle(target))
    setMoves(0); setLeaving({}); setShake(null); setHint(null); setWon(false)
  }, [])

  const tap = (r, c) => {
    const cell = board[r][c]
    if (!cell || leaving[cell.id]) return
    if (pathClear(board, r, c, cell.dir)) {
      setHint(null)
      setMoves((m) => m + 1)
      setLeaving((s) => ({ ...s, [cell.id]: cell.dir }))
      const t = setTimeout(() => {
        setBoard((b) => { const nb = b.map((row) => row.slice()); nb[r][c] = null; return nb })
        setLeaving((s) => { const n = { ...s }; delete n[cell.id]; return n })
      }, 200)
      timers.current.push(t)
    } else {
      setShake(cell.id)
      const t = setTimeout(() => setShake((v) => (v === cell.id ? null : v)), 320)
      timers.current.push(t)
    }
  }

  const showHint = () => {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cell = board[r][c]
      if (cell && !leaving[cell.id] && pathClear(board, r, c, cell.dir)) {
        setHint(cell.id)
        const t = setTimeout(() => setHint((v) => (v === cell.id ? null : v)), 1200)
        timers.current.push(t)
        return
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none text-slate-100">
      <div className="flex items-center gap-4 text-sm font-semibold">
        <span>Level {level}</span>
        <span>Left: {remaining}</span>
        <span>Moves: {moves}</span>
        <span className="text-amber-300">Best: {best == null ? '—' : `${best}`}</span>
      </div>

      <div className="relative rounded-xl bg-slate-800/40 p-2">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 38px)`, gridAutoRows: '38px' }}>
          {board.map((row, r) => row.map((cell, c) => {
            if (!cell) {
              return <div key={`${r}-${c}`} className="flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-slate-600/70" />
              </div>
            }
            const isLeaving = !!leaving[cell.id]
            const isShake = shake === cell.id
            const isHint = hint === cell.id
            return (
              <div key={cell.id} className="flex items-center justify-center overflow-visible">
                <button type="button" onClick={() => tap(r, c)}
                  className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center text-xl font-black leading-none transition-all duration-200 ease-out
                    ${isShake ? 'text-red-400 arrow-shake' : 'text-slate-100 hover:bg-white/10'}
                    ${isHint ? 'ring-2 ring-amber-400 bg-amber-400/10' : ''}`}
                  style={isLeaving ? { transform: FLY[cell.dir], opacity: 0 } : undefined}>
                  {GLYPH[cell.dir]}
                </button>
              </div>
            )
          }))}
        </div>
      </div>

      <div className="h-6 text-center text-sm font-semibold">
        {won ? <span className="text-amber-300">Board cleared in {moves} moves! 🎉</span>
          : <span className="text-slate-400">Tap an arrow with a clear path to the edge.</span>}
      </div>

      <div className="flex items-center gap-2">
        {won ? (
          <button type="button" onClick={() => { const nl = level + 1; setLevel(nl); newPuzzle(nl) }}
            className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-sm font-bold hover:bg-amber-300">Next level →</button>
        ) : (
          <button type="button" onClick={showHint}
            className="px-3 py-1.5 rounded-lg border border-white/20 text-slate-200 text-sm font-bold hover:bg-white/10 inline-flex items-center gap-1.5">💡 Hint</button>
        )}
        <button type="button" onClick={() => newPuzzle(level)}
          className="px-3 py-1.5 rounded-lg bg-slate-200 text-black text-sm font-bold hover:bg-white">New puzzle</button>
      </div>
    </div>
  )
}
