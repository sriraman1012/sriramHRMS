import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from './icons.jsx'

const pillCls = 'inline-flex items-center gap-1.5 h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2.5'
const pad = (n) => String(n).padStart(2, '0')
const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// Compact single-date calendar picker (same look as the range picker).
export default function SingleDatePicker({ value, onChange, todayIso }) {
  const [open, setOpen] = useState(false)
  const sel = value ? new Date(value + 'T00:00:00') : new Date()
  const [view, setView] = useState({ year: sel.getFullYear(), month: sel.getMonth() })

  const step = (n) => setView((v) => { const d = new Date(v.year, v.month + n, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  const first = new Date(view.year, view.month, 1).getDay()
  const days = new Date(view.year, view.month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  const yearOpts = Array.from({ length: 9 }, (_, i) => view.year - 4 + i)
  const pick = (iso) => { onChange(iso); setOpen(false) }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={pillCls} title="Pick a day">
        <span className="text-blue-600 dark:text-blue-400"><Calendar size={14} /></span>
        <span className="text-xs font-bold">{value || 'Today'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 left-0 w-max rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] shadow-xl p-4">
            <div className="flex items-center gap-1 mb-2 w-60">
              <select value={view.month} onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
                className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={view.year} onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
                className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                {yearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="ml-auto flex items-center gap-0.5">
                <button type="button" onClick={() => step(-1)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft size={15} /></button>
                <button type="button" onClick={() => step(1)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight size={15} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] text-slate-400 font-bold mb-1 w-60">
              {WD.map((w) => <div key={w} className="py-0.5">{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5 w-60">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />
                const iso = isoOf(view.year, view.month, d)
                const dow = new Date(view.year, view.month, d).getDay()
                const isSel = iso === value
                const isToday = iso === todayIso
                return (
                  <button type="button" key={i} onClick={() => pick(iso)}
                    className={`h-8 text-[13px] rounded-md font-bold transition-colors ${
                      isSel ? 'bg-blue-600 text-white'
                        : isToday ? 'ring-1 ring-blue-400 text-blue-600 dark:text-blue-300'
                          : dow === 0 || dow === 6 ? 'text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}>
                    {d}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
              <button type="button" onClick={() => pick(todayIso)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300">Today</button>
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
