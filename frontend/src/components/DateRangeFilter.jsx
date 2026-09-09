import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, Building, ChevronLeft, ChevronRight } from './icons.jsx'

const pillCls = 'inline-flex items-center gap-1.5 h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2.5'
const pad = (n) => String(n).padStart(2, '0')
const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// One month grid with selectable days for a range.
function MonthGrid({ year, month, from, to, onPick, onMonth, onYear, onStep, compact = false }) {
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  const yearOpts = Array.from({ length: 9 }, (_, i) => year - 4 + i)

  return (
    <div className={`w-full ${compact ? 'sm:w-44' : 'sm:w-56'}`}>
      <div className="flex items-center gap-1 mb-2">
        <select value={month} onChange={(e) => onMonth(Number(e.target.value))}
          className="bg-transparent text-sm font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-200">
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => onYear(Number(e.target.value))}
          className="bg-transparent text-sm font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-200">
          {yearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={() => onStep(-1)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft size={15} /></button>
          <button type="button" onClick={() => onStep(1)} className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-slate-400 font-bold mb-1">
        {WD.map((w) => <div key={w} className="py-0.5">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const iso = isoOf(year, month, d)
          const dow = new Date(year, month, d).getDay()
          const end = iso === from || iso === to
          const inRange = from && to && iso > from && iso < to
          return (
            <button type="button" key={i} onClick={() => onPick(iso)}
              className={`${compact ? 'h-7 text-[12px]' : 'h-8 text-[13px]'} rounded-md font-bold transition-colors ${
                end ? 'bg-blue-600 text-white'
                  : inRange ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                    : dow === 0 || dow === 6 ? 'text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Compact from–to date-range filter with a two-month calendar. Optional department pill.
export default function DateRangeFilter({ from, to, onChange, departments, departmentId, setDepartmentId, dark = false, compact = false, inline = false }) {
  // Force a readable dark trigger on always-dark surfaces (e.g. the dashboard chart card).
  const triggerCls = dark
    ? 'inline-flex items-center gap-1.5 h-9 rounded-lg border border-white/15 bg-[#1e2235] text-slate-100 px-2.5'
    : pillCls
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState({ from, to })
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const [left, setLeft] = useState(() => {
    const d = from ? new Date(from + 'T00:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const openPicker = () => {
    setPending({ from, to })
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) {
      const w = compact ? 384 : 468
      const h = compact ? 300 : 340
      let l = Math.min(r.left, window.innerWidth - w - 8)
      l = Math.max(8, l)
      const openUp = r.bottom + h + 8 > window.innerHeight && r.top - h - 8 > 0
      const top = openUp ? Math.max(8, r.top - h - 6) : r.bottom + 6
      setPos({ top, left: l })
    }
    setOpen(true)
  }
  const right = { year: left.month === 11 ? left.year + 1 : left.year, month: (left.month + 1) % 12 }
  const stepLeft = (n) => setLeft((l) => { const d = new Date(l.year, l.month + n, 1); return { year: d.getFullYear(), month: d.getMonth() } })
  // Selecting a month/year on the RIGHT calendar keeps the pair consecutive.
  const setRightMY = (year, month0) => { const d = new Date(year, month0 - 1, 1); setLeft({ year: d.getFullYear(), month: d.getMonth() }) }

  const pick = (iso) => {
    setPending((p) => {
      if (!p.from || (p.from && p.to)) return { from: iso, to: '' }        // start a new range
      return iso < p.from ? { from: iso, to: p.from } : { from: p.from, to: iso }
    })
  }
  const apply = () => {
    const f = pending.from || from
    const t = pending.to || pending.from || to
    onChange({ from: f, to: t })
    setOpen(false)
  }

  // Inline mode: always-visible two-month range calendar (no popover — for use inside forms/modals).
  if (inline) {
    const pickInline = (iso) => setPending((p) => {
      const next = (!p.from || (p.from && p.to)) ? { from: iso, to: '' } : (iso < p.from ? { from: iso, to: p.from } : { from: p.from, to: iso })
      onChange({ from: next.from, to: next.to || next.from })
      return next
    })
    return (
      <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <MonthGrid year={left.year} month={left.month} from={pending.from} to={pending.to} onPick={pickInline} compact
            onMonth={(m) => setLeft((l) => ({ ...l, month: m }))} onYear={(y) => setLeft((l) => ({ ...l, year: y }))} onStep={stepLeft} />
          <MonthGrid year={right.year} month={right.month} from={pending.from} to={pending.to} onPick={pickInline} compact
            onMonth={(m) => setRightMY(right.year, m + 1)} onYear={(y) => setRightMY(y, right.month + 1)} onStep={stepLeft} />
        </div>
        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-2 text-center">
          {pending.from || '—'} <span className="mx-1 text-slate-400">→</span> {pending.to || pending.from || '—'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button ref={triggerRef} type="button" onClick={() => (open ? setOpen(false) : openPicker())} className={triggerCls} title="Filter by date range">
          <span className={dark ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'}><Calendar size={14} /></span>
          <span className="text-xs font-bold">{from} — {to}</span>
        </button>
        {open && createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
            <div className="fixed z-[61] w-max max-w-[92vw] rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] shadow-2xl p-3"
              style={{ top: pos.top, left: pos.left }} onClick={(e) => e.stopPropagation()}>
              <div className={`flex flex-col sm:flex-row ${compact ? 'gap-3' : 'gap-4'}`}>
                <MonthGrid year={left.year} month={left.month} from={pending.from} to={pending.to} onPick={pick} compact={compact}
                  onMonth={(m) => setLeft((l) => ({ ...l, month: m }))} onYear={(y) => setLeft((l) => ({ ...l, year: y }))} onStep={stepLeft} />
                <MonthGrid year={right.year} month={right.month} from={pending.from} to={pending.to} onPick={pick} compact={compact}
                  onMonth={(m) => setRightMY(right.year, m + 1)} onYear={(y) => setRightMY(y, right.month + 1)} onStep={stepLeft} />
              </div>
              <div className="flex items-center gap-3 border-t border-slate-200 dark:border-white/10 mt-2 pt-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {pending.from || '—'} <span className="mx-1">→</span> {pending.to || pending.from || '—'}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300">Cancel</button>
                  <button type="button" onClick={apply} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Apply</button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
      </div>

      {departments && (
        <span className={pillCls} title="Department">
          <span className="text-blue-600 dark:text-blue-400"><Building size={14} /></span>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="bg-transparent text-xs font-bold outline-none cursor-pointer max-w-[150px]">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
          </select>
        </span>
      )}
    </div>
  )
}
