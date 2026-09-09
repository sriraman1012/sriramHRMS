import { useEffect, useMemo, useRef, useState } from 'react'
import { useRights } from '../../context/RightsContext.jsx'
import * as XLSX from 'xlsx'
import { getSheet, saveSheet, copyPrevious } from '../../api/attendance.js'
import { getDepartments, getHolidays } from '../../api/masters.js'
import { getWeeklyOff, getWorkingDays, saveWorkingDays } from '../../api/settings.js'
import Pagination from '../../components/Pagination.jsx'
import { Clipboard, Save, Copy, Upload, Download, Search, Calendar, X, MapPin } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import MonthNav from '../../components/MonthNav.jsx'
import { isWeeklyOff } from '../../weeklyOff.js'

// Compact icon-pill filter styles
const pillCls = 'inline-flex items-center gap-1.5 h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2'
const pillInput = 'bg-transparent text-xs font-bold outline-none cursor-pointer'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const CODES = [
  { code: 'P', label: 'Present', icon: '✅', cls: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
  { code: 'PO', label: 'Present Onsite', icon: '📍', cls: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300' },
  { code: 'A', label: 'Absent', icon: '❌', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
  { code: 'L', label: 'Leave', icon: '🌴', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  { code: 'HD', label: 'Half Day', icon: '🌗', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  { code: 'H', label: 'Holiday', icon: '🎉', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  { code: 'WO', label: 'Weekly Off', icon: '🌙', cls: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
]
const VALID = CODES.map((c) => c.code)
const clsOf = (code) => CODES.find((c) => c.code === code)?.cls || ''

// Medium-dark cell colours for the day grid (stronger than the light palette pills).
const CELL_CLS = {
  P: 'bg-green-600 text-white',
  PO: 'bg-teal-600 text-white',
  A: 'bg-red-600 text-white',
  L: 'bg-amber-500 text-white',
  HD: 'bg-purple-600 text-white',
  H: 'bg-blue-600 text-white',
  WO: 'bg-slate-500 text-white',
}

const now = new Date()

// 3D pressable palette button: raised with a bottom edge, presses down on click,
// and stays pressed-in when it's the selected brush.
const codeBtnBase = 'flex items-center justify-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-100 select-none'
const codeRaised = 'shadow-[0_3px_0_0_rgba(0,0,0,0.18)] hover:-translate-y-px active:translate-y-[3px] active:shadow-none'
const codePressed = 'translate-y-[3px] shadow-none ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-[#161925] border-blue-500'

export default function AttendanceEntry() {
  const { can } = useRights()
  const canEdit = can('att-entry', 'edit') || can('att-entry', 'add')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])

  const [employees, setEmployees] = useState([])
  const [holidays, setHolidays] = useState(new Set())
  const [holNames, setHolNames] = useState({}) // day number -> holiday name (current month), for the tooltip
  const [entries, setEntries] = useState({}) // key `${empId}_${day}` -> code
  const [notes, setNotes] = useState({})     // key `${empId}_${day}` -> onsite customer/place (PO only)
  const [brush, setBrush] = useState('P')
  const [poCell, setPoCell] = useState(null) // { empId, day } while the PO customer popup is open
  const [poName, setPoName] = useState('')
  const [tip, setTip] = useState(null) // custom onsite tooltip { text, x, y }

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [empSearch, setEmpSearch] = useState('')
  const [empSearchOpen, setEmpSearchOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const [weeklyCfg, setWeeklyCfg] = useState({ days: [0, 6], nth: {} }) // weekly-off rules
  const [workingDays, setWorkingDays] = useState('')
  const [wdSaving, setWdSaving] = useState(false)

  const days = useMemo(() => new Date(year, month, 0).getDate(), [year, month])
  const dow = (d) => new Date(year, month - 1, d).getDay()
  const isWeekend = (d) => isWeeklyOff(new Date(year, month - 1, d), weeklyCfg)

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
    getWeeklyOff().then((r) => setWeeklyCfg({ days: r.days || [], nth: r.nth || {} })).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSheet(year, month, departmentId)
      setEmployees(data.employees || [])
      const holSet = new Set(data.holidays || [])
      setHolidays(holSet)
      // Holiday names for this month (the sheet only returns day numbers) — used for the hover tooltip.
      getHolidays().then((list) => {
        const hn = {}
        for (const h of list || []) {
          const dt = new Date(`${String(h.holidayDate).slice(0, 10)}T00:00:00`)
          if (dt.getFullYear() === year && dt.getMonth() + 1 === month) hn[dt.getDate()] = h.holidayName
        }
        setHolNames(hn)
      }).catch(() => setHolNames({}))
      const map = {}
      const noteMap = {}
      for (const e of data.entries || []) {
        map[`${e.employeeId}_${e.day}`] = e.statusCode
        if (e.note) noteMap[`${e.employeeId}_${e.day}`] = e.note
      }
      setEntries(map)
      setNotes(noteMap)
      setPage(1)
      // Working days: manual override if set, else auto (weekdays - weekly-off - holidays)
      const dim = new Date(year, month, 0).getDate()
      let auto = 0
      for (let d = 1; d <= dim; d++) {
        if (!isWeeklyOff(new Date(year, month - 1, d), weeklyCfg) && !holSet.has(d)) auto++
      }
      const wd = await getWorkingDays(year, month).catch(() => ({ workingDays: null }))
      setWorkingDays(String(wd?.workingDays ?? auto))
    } catch {
      setError('Failed to load. Is the API running / are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, departmentId]) // NOTE: weeklyCfg intentionally excluded so a late
  // weekly-off load never re-fetches the sheet and wipes unsaved painting.

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  // Employee column search only affects what is displayed; Save/Export/Auto still use the full list.
  const esq = empSearch.trim().toLowerCase()
  const filteredEmployees = esq
    ? employees.filter((e) => `${e.name} ${e.employeeCode}`.toLowerCase().includes(esq))
    : employees

  // Pagination over the (filtered) employee rows.
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageEmployees = filteredEmployees.slice(offset, offset + pageSize)

  const paintCell = (empId, day) => {
    if (!canEdit) return
    const k = `${empId}_${day}`
    // PO needs a customer/location → open the popup instead of painting directly.
    if (brush === 'PO') {
      setPoCell({ empId, day })
      setPoName(notes[k] || '')
      return
    }
    setEntries((prev) => {
      const next = { ...prev }
      if (brush === 'CLR') delete next[k]
      else next[k] = brush
      return next
    })
    // Painting anything other than PO clears any stale onsite note on that cell.
    setNotes((prev) => {
      if (!prev[k]) return prev
      const next = { ...prev }; delete next[k]; return next
    })
  }

  // Confirm the PO popup: mark the cell PO and store the onsite customer/place.
  const confirmPo = () => {
    const name = poName.trim()
    if (!name) { setError('Please enter the customer / onsite place.'); return }
    const k = `${poCell.empId}_${poCell.day}`
    setEntries((prev) => ({ ...prev, [k]: 'PO' }))
    setNotes((prev) => ({ ...prev, [k]: name }))
    setPoCell(null); setPoName(''); setError('')
  }

  const autoFill = () => {
    setEntries((prev) => {
      const next = { ...prev }
      for (const emp of employees) {
        for (let d = 1; d <= days; d++) {
          const k = `${emp.employeeId}_${d}`
          const code = next[k]
          if (holidays.has(d)) {
            // Holiday: mark H (fill empty or replace a stale WO; keep real P/A/L/HD).
            if (!code || code === 'WO') next[k] = 'H'
          } else if (isWeekend(d)) {
            // Weekly-off day: mark WO only if empty.
            if (!code) next[k] = 'WO'
          } else if (code === 'WO') {
            // A working day (per the current weekly-off pattern) still marked WO → clear it.
            delete next[k]
          }
        }
      }
      return next
    })
    flash('Aligned to the weekly-off pattern: weekends → WO, holidays → H, stale WO on working days cleared (remember to Save).')
  }

  const buildEntries = () => {
    const list = []
    for (const emp of employees) {
      for (let d = 1; d <= days; d++) {
        const k = `${emp.employeeId}_${d}`
        const code = entries[k] || ''
        list.push({ employeeId: emp.employeeId, day: d, statusCode: code, note: code === 'PO' ? (notes[k] || '') : null })
      }
    }
    return list
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await saveSheet({ year, month, entries: buildEntries() })
      flash('Attendance saved.')
    } catch {
      setError('Could not save attendance.')
    } finally {
      setSaving(false)
    }
  }

  const saveWD = async () => {
    const n = parseInt(workingDays, 10)
    if (Number.isNaN(n) || n < 0) return setError('Enter a valid number of working days.')
    setWdSaving(true)
    setError('')
    try {
      await saveWorkingDays(year, month, n)
      flash('Working days saved.')
    } catch {
      setError('Could not save working days.')
    } finally {
      setWdSaving(false)
    }
  }

  const doCopyPrevious = async () => {
    if (!window.confirm('Copy the previous month’s attendance into this month? Existing cells for matching days will be overwritten.')) return
    setSaving(true)
    setError('')
    try {
      const res = await copyPrevious({ year, month, departmentId: departmentId || null })
      await load()
      flash(res.message || 'Copied.')
    } catch {
      setError('Copy failed.')
    } finally {
      setSaving(false)
    }
  }

  const exportExcel = () => {
    const header = ['Emp Code', 'Employee Name', ...Array.from({ length: days }, (_, i) => i + 1)]
    const rows = employees.map((emp) => [
      emp.employeeCode, emp.name,
      ...Array.from({ length: days }, (_, i) => entries[`${emp.employeeId}_${i + 1}`] || ''),
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [{ wch: 12 }, { wch: 22 }, ...Array.from({ length: days }, () => ({ wch: 4 }))]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
    XLSX.writeFile(wb, `Attendance_${MONTHS[month - 1]}_${year}.xlsx`)
  }

  const importExcel = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 })
        if (!aoa.length) return
        const byCode = {}
        for (const emp of employees) byCode[String(emp.employeeCode).trim().toLowerCase()] = emp.employeeId
        const next = { ...entries }
        for (let r = 1; r < aoa.length; r++) {
          const row = aoa[r]
          if (!row || !row[0]) continue
          const empId = byCode[String(row[0]).trim().toLowerCase()]
          if (!empId) continue
          for (let d = 1; d <= days; d++) {
            const val = String(row[d + 1] ?? '').trim().toUpperCase()
            const k = `${empId}_${d}`
            if (VALID.includes(val)) next[k] = val
            else if (val === '') delete next[k]
          }
        }
        setEntries(next)
        flash('Imported from Excel — review and click Save.')
      } catch {
        setError('Could not read that Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const btn = 'px-3 py-2 rounded-lg text-sm font-bold border transition-colors'

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2"><Clipboard /> Attendance Entry</h1>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button onClick={save} disabled={saving} className={`${btn} flex items-center gap-1.5 bg-blue-600 border-blue-600 text-white hover:bg-blue-700 disabled:opacity-60`}><Save /> Save</button>
          )}
          {canEdit && (
            <button onClick={doCopyPrevious} disabled={saving} className={`${btn} flex items-center gap-1.5 border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5`}><Copy /> Copy Previous Month</button>
          )}
          <button onClick={() => fileRef.current?.click()} className={`${btn} flex items-center gap-1.5 border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5`}><Upload /> Import Excel</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
          <button onClick={exportExcel} className={`${btn} flex items-center gap-1.5 border-green-600 bg-green-600 text-white hover:bg-green-700`}><Download /> Export Excel</button>
        </div>
      </div>

      {/* Filters (left) + code palette (right, under the action buttons) */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Prev / Next month */}
          <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
          {/* Month */}
          <span className={pillCls} title="Month">
            <span className="text-blue-600 dark:text-blue-400"><Calendar size={14} /></span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={pillInput}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </span>
          {/* Year */}
          <span className={pillCls} title="Year">
            <span className="text-blue-600 dark:text-blue-400"><Calendar size={14} /></span>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={pillInput}>
              {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </span>
          {/* Department */}
          <span className={pillCls} title="Department">
            <span className="text-sm">🏢</span>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={`${pillInput} max-w-[150px]`}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
          </span>
          {/* Working days */}
          <span className={pillCls} title="Manual working days for this month (overrides auto)">
            <span className="text-sm">📅</span>
            <input type="number" min="0" value={workingDays} readOnly={!canEdit} onChange={(e) => setWorkingDays(e.target.value)}
              className="w-12 bg-transparent text-xs font-bold outline-none" />
            {canEdit && (
              <button onClick={saveWD} disabled={wdSaving} title="Save working days for this month"
                className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[11px] font-bold">Set</button>
            )}
          </span>
        </div>

        {/* Code palette — single 3D pressable row */}
        <div className="flex flex-col items-start lg:items-end gap-1.5 w-full lg:w-auto lg:ml-auto">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Click a code, then click cells{brush !== 'CLR' ? <> · <span className="text-blue-600 dark:text-blue-400">Selected: {CODES.find((c) => c.code === brush)?.icon} {brush}</span></> : ''}:
          </span>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1.5 max-w-full">
            {CODES.map((c) => {
              const active = brush === c.code
              return (
                <button key={c.code} onClick={() => setBrush(c.code)} title={c.label}
                  className={`${codeBtnBase} ${c.cls} ${active ? codePressed : `border-black/10 dark:border-white/10 ${codeRaised}`}`}>
                  <span>{c.icon}</span> {c.code} · {c.label} {active && <span className="text-blue-600 dark:text-blue-300">✓</span>}
                </button>
              )
            })}
            <button onClick={() => setBrush('CLR')} title="Eraser"
              className={`${codeBtnBase} bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200 ${brush === 'CLR' ? codePressed : `border-black/10 dark:border-white/10 ${codeRaised}`}`}>
              🧽 Clear {brush === 'CLR' && <span className="text-blue-600 dark:text-blue-300">✓</span>}
            </button>
            <button onClick={autoFill} title="Auto-fill: Weekends → WO, Holidays → H"
              className={`${codeBtnBase} bg-white text-slate-600 dark:bg-[#1e2235] dark:text-slate-300 border-slate-300 dark:border-white/15 ${codeRaised}`}>
              ✨ Auto Fill
            </button>
          </div>
        </div>
      </div>

      {(msg || error) && (
        <div className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{error || msg}</div>
      )}

      {/* Grid */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#1e2235] text-slate-500 dark:text-slate-400">
              <th style={{ width: 150 }} className="sticky left-0 z-20 bg-slate-50 dark:bg-[#1e2235] text-left px-3 py-2 font-bold border-r border-slate-200 dark:border-white/10 align-top">
                <div className="flex items-center gap-1">
                  <span>Employee Name</span>
                  <button onClick={() => setEmpSearchOpen((o) => !o)} title="Search employee"
                    className={`p-0.5 rounded ${empSearch ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                    <Search size={12} />
                  </button>
                </div>
                {empSearchOpen && (
                  <div className="relative mt-1">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                    <input autoFocus value={empSearch} onChange={(e) => { setEmpSearch(e.target.value); setPage(1) }} placeholder="Search"
                      className="w-full pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] font-normal normal-case outline-none focus:border-blue-500" />
                  </div>
                )}
              </th>
              {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                const wknd = isWeekend(d), hol = holidays.has(d)
                return (
                  <th key={d} className={`px-0 py-1 font-bold text-center border border-slate-300 dark:border-white/15 ${hol ? 'bg-amber-50 dark:bg-amber-500/10 cursor-help' : wknd ? 'bg-slate-100 dark:bg-white/5' : ''}`}
                    onMouseEnter={hol && holNames[d] ? (e) => { const r = e.currentTarget.getBoundingClientRect(); setTip({ x: r.left + r.width / 2, y: r.top - 6, text: holNames[d], kind: 'holiday' }) } : undefined}
                    onMouseLeave={hol ? () => setTip(null) : undefined}>
                    <div>{d}</div>
                    <div className="text-[9px] opacity-60">{WD[dow(d)]}</div>
                    {hol && <div className="text-[9px] text-amber-600 leading-none">•</div>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={days + 1} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
            ) : filteredEmployees.length === 0 ? (
              <tr><td colSpan={days + 1} className="px-4 py-6 text-center text-slate-400">{esq ? 'No employees match your search.' : 'No active employees for this filter.'}</td></tr>
            ) : (
              pageEmployees.map((emp) => (
                <tr key={emp.employeeId} className="border-t border-slate-100 dark:border-white/5">
                  <td style={{ width: 150 }} className="sticky left-0 z-10 bg-white dark:bg-[#161925] px-3 py-1.5 font-bold truncate border-r border-slate-200 dark:border-white/10" title={`${emp.name} (${emp.employeeCode})`}>{emp.name}</td>
                  {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                    const code = entries[`${emp.employeeId}_${d}`]
                    const wknd = isWeekend(d), hol = holidays.has(d)
                    return (
                      <td key={d} className={`p-0 text-center border border-slate-300 dark:border-white/15 ${hol ? 'bg-amber-50/60 dark:bg-amber-500/5' : wknd ? 'bg-slate-50 dark:bg-white/[0.03]' : ''}`}>
                        <button onClick={() => paintCell(emp.employeeId, d)}
                          onMouseEnter={(e) => {
                            const note = code === 'PO' ? notes[`${emp.employeeId}_${d}`] : ''
                            const r = e.currentTarget.getBoundingClientRect()
                            const pos = { x: r.left + r.width / 2, y: r.top - 6 }
                            if (note) setTip({ ...pos, text: note, kind: 'onsite' })
                            else if (hol && holNames[d]) setTip({ ...pos, text: holNames[d], kind: 'holiday' })
                          }}
                          onMouseLeave={() => setTip(null)}
                          className={`w-full h-7 text-[11px] font-bold ${canEdit ? 'cursor-pointer' : 'cursor-default'} ${code ? CELL_CLS[code] || clsOf(code) : `text-slate-400 ${canEdit ? 'hover:bg-blue-50 dark:hover:bg-blue-500/10' : ''}`}`}>
                          {code || ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length > 0 && (
        <Pagination total={filteredEmployees.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Grey = weekend · Amber = holiday. Codes: P Present · PO Present Onsite · A Absent · L Leave · HD Half Day · H Holiday · WO Weekly Off. Click <b>Save</b> to persist.
      </p>

      {/* Custom tooltip (dashboard style) — onsite customer/place or holiday name */}
      {tip && (
        <div className="fixed z-[80] pointer-events-none -translate-x-1/2 -translate-y-full" style={{ left: tip.x, top: tip.y }}>
          <div className="rounded-xl border border-white/15 bg-[#0d0f18]/95 px-3 py-2 shadow-2xl text-white min-w-[120px]">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-1">
              {tip.kind === 'holiday' ? <span>🎉</span> : <MapPin size={11} />} {tip.kind === 'holiday' ? 'Holiday' : 'Onsite'}
            </div>
            <div className="text-sm font-bold">{tip.text}</div>
          </div>
          <div className="w-2 h-2 rotate-45 bg-[#0d0f18] border-r border-b border-white/15 mx-auto -mt-1" />
        </div>
      )}

      {poCell && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setPoCell(null); setPoName('') }}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-bold flex items-center gap-2">📍 Present Onsite</h3>
              <button type="button" onClick={() => { setPoCell(null); setPoName('') }} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Where is the employee going? Enter the customer / onsite place.</p>
            <label className="block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1">Customer / Onsite place</label>
            <input autoFocus value={poName} onChange={(e) => setPoName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmPo() }}
              placeholder="e.g. ABC Industries, Chennai"
              className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-sm px-3 py-2 outline-none focus:border-blue-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setPoCell(null); setPoName('') }} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={confirmPo} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold">Set Onsite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
