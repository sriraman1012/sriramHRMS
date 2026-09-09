import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { getSheet } from '../../api/attendance.js'
import { getDepartments } from '../../api/masters.js'
import { getWeeklyOff, getWorkingDays } from '../../api/settings.js'
import { Download, Search, FileText } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import PeriodFilter from '../../components/PeriodFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import { exportReportPdf } from '../../reportPdf.js'
import { isWeeklyOff } from '../../weeklyOff.js'
import { useRights } from '../../context/RightsContext.jsx'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const now = new Date()
const selectCls = 'rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-base px-3 py-2 outline-none'
const fmt = (n) => Math.round((Number(n) || 0) * 10) / 10

// Medium-dark cells, matching the Attendance Entry grid.
const CODE_CLS = {
  P: 'bg-green-600 text-white',
  PO: 'bg-teal-600 text-white',
  A: 'bg-red-600 text-white',
  L: 'bg-amber-500 text-white',
  HD: 'bg-purple-600 text-white',
  H: 'bg-blue-600 text-white',
  WO: 'bg-slate-500 text-white',
}

// Breakup columns — compact single-view summary.
const COLUMNS = [
  {
    key: 'employee', label: 'Employee', align: 'left', exportKey: 'Employee',
    get: (r) => `${r.name} ${r.code}`, exportVal: (r) => r.name,
    render: (r) => <span className="font-bold">{r.name}</span>,
  },
  { key: 'workingDays', label: 'Working Days', get: (r) => String(r.workingDays), exportVal: (r) => r.workingDays,
    render: (r) => <span className="text-slate-600 dark:text-slate-300">{r.workingDays}</span> },
  { key: 'present', label: 'Present Days', get: (r) => String(r.present), exportVal: (r) => r.present,
    render: (r) => <span className="font-bold text-green-600 dark:text-green-400">{r.present}</span> },
  { key: 'leave', label: 'Leave Days', get: (r) => String(fmt(r.leave)), exportVal: (r) => fmt(r.leave),
    render: (r) => <span className="font-bold text-amber-600 dark:text-amber-400">{fmt(r.leave)}</span> },
  { key: 'sick', label: 'Sick Leave', get: (r) => String(r.sick), exportVal: (r) => r.sick,
    render: (r) => <span className="text-slate-600 dark:text-slate-300">{r.sick}</span> },
  { key: 'actualPlus', label: 'Gross Working Days', get: (r) => String(fmt(r.actualPlus)), exportVal: (r) => fmt(r.actualPlus),
    render: (r) => <span className="font-bold">{fmt(r.actualPlus)}</span> },
  { key: 'balance', label: 'Balance Carry Forward', get: (r) => String(fmt(r.balance)), exportVal: (r) => fmt(r.balance),
    render: (r) => <span className={`font-bold ${r.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{fmt(r.balance)}</span> },
]

export default function AttendanceDetailReport() {
  const { can } = useRights()
  const canExport = can('rpt-detail', 'export')
  const [view, setView] = useState('breakup') // 'breakup' | 'datewise'
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [weeklyOff, setWeeklyOff] = useState({ days: [0, 6], nth: {} })
  const [employees, setEmployees] = useState([])
  const [holidays, setHolidays] = useState(new Set())
  const [entries, setEntries] = useState({})
  const [workingDays, setWorkingDays] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [empSearchOpen, setEmpSearchOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const days = useMemo(() => new Date(year, month, 0).getDate(), [year, month])
  const dow = (d) => new Date(year, month - 1, d).getDay()
  const isWeekend = (d) => isWeeklyOff(new Date(year, month - 1, d), weeklyOff)

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
    getWeeklyOff().then((r) => setWeeklyOff({ days: r.days || [], nth: r.nth || {} })).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    getSheet(year, month, departmentId)
      .then(async (data) => {
        setEmployees(data.employees || [])
        const holSet = new Set(data.holidays || [])
        setHolidays(holSet)
        const map = {}
        for (const e of data.entries || []) map[`${e.employeeId}_${e.day}`] = e.statusCode
        setEntries(map)
        const dim = new Date(year, month, 0).getDate()
        let auto = 0
        for (let d = 1; d <= dim; d++) {
          if (!isWeeklyOff(new Date(year, month - 1, d), weeklyOff) && !holSet.has(d)) auto++
        }
        const wd = await getWorkingDays(year, month).catch(() => ({ workingDays: null }))
        setWorkingDays(Number(wd?.workingDays ?? auto))
      })
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false))
  }, [year, month, departmentId, weeklyOff])

  // Weekly-offs for the month = days in month − working days (auto).
  const woMonth = Math.max(0, days - workingDays)

  // Per-employee breakup rows.
  const rows = useMemo(() => {
    return employees.map((emp) => {
      let present = 0, leave = 0, woWorked = 0
      for (let d = 1; d <= days; d++) {
        const wknd = isWeeklyOff(new Date(year, month - 1, d), weeklyOff)
        const hol = holidays.has(d)
        const code = entries[`${emp.employeeId}_${d}`]
        if (code === 'P' || code === 'PO') {
          if (wknd) woWorked++
          else if (!hol) present++
        } else if (!wknd && !hol) {
          if (code === 'L' || code === 'A') leave += 1
          else if (code === 'HD') leave += 0.5
        }
      }
      const woBalance = Math.min(woWorked, woMonth)
      const sick = 1
      const actualPlus = present + sick + woBalance
      const balance = actualPlus - workingDays
      return { employeeId: emp.employeeId, name: emp.name, code: emp.employeeCode, workingDays, present, leave, sick, actualPlus, balance }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, entries, holidays, weeklyOff, workingDays, woMonth, days, year, month])

  const monthLabel = `${MONTHS[month - 1]} ${year}`
  const deptLabel = departmentId ? departments.find((d) => String(d.departmentId) === String(departmentId))?.departmentName : 'All Departments'

  const gq = query.trim().toLowerCase()

  // Breakup filtering (global + per-column)
  const filtered = rows.filter((r) => {
    if (gq && !`${r.name} ${r.code}`.toLowerCase().includes(gq)) return false
    for (const col of COLUMNS) {
      const f = (colFilters[col.key] || '').trim().toLowerCase()
      if (f && !col.get(r).toLowerCase().includes(f)) return false
    }
    return true
  })
  // Date-wise filtering (global only)
  const dwFiltered = employees.filter((e) => !gq || `${e.employeeCode} ${e.name}`.toLowerCase().includes(gq))

  const activeList = view === 'breakup' ? filtered : dwFiltered
  const pageCount = Math.max(1, Math.ceil(activeList.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageBreakup = filtered.slice(offset, offset + pageSize)
  const pageEmployees = dwFiltered.slice(offset, offset + pageSize)
  const setColFilter = (key, val) => setColFilters((prev) => ({ ...prev, [key]: val }))
  const switchView = (v) => { setView(v); setPage(1) }

  const exportBreakup = () => {
    const header = ['S.No', ...COLUMNS.map((c) => c.exportKey || c.label)]
    const body = filtered.map((r, i) => [i + 1, ...COLUMNS.map((col) => col.exportVal(r))])
    const aoa = [['UNIPRO ATTENDANCE'], [`Attendance Detail (Breakup) - ${monthLabel} - ${deptLabel}`], [], header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 6 }, { wch: 22 }, ...COLUMNS.slice(1).map(() => ({ wch: 16 }))]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Breakup')
    XLSX.writeFile(wb, `Attendance_Breakup_${MONTHS[month - 1]}_${year}.xlsx`)
  }

  const exportGrid = () => {
    const header = ['Emp Code', 'Employee Name', ...Array.from({ length: days }, (_, i) => i + 1)]
    const body = dwFiltered.map((emp) => [
      emp.employeeCode, emp.name,
      ...Array.from({ length: days }, (_, i) => entries[`${emp.employeeId}_${i + 1}`] || ''),
    ])
    const aoa = [['UNIPRO ATTENDANCE'], [`Attendance Detail (Date-wise) - ${monthLabel} - ${deptLabel}`], [], header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 12 }, { wch: 22 }, ...Array.from({ length: days }, () => ({ wch: 4 }))]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Date-wise')
    XLSX.writeFile(wb, `Attendance_Datewise_${MONTHS[month - 1]}_${year}.xlsx`)
  }

  const exportBreakupPdf = () => {
    exportReportPdf({
      title: 'Attendance Detail — Summary Breakup',
      subtitle: `${monthLabel}  ·  ${deptLabel}`,
      head: ['S.No', ...COLUMNS.map((c) => c.label)],
      aligns: ['left', 'left', ...COLUMNS.slice(1).map(() => 'center')],
      body: filtered.map((r, i) => [i + 1, ...COLUMNS.map((col) => col.exportVal(r))]),
    })
  }

  const exportGridPdf = () => {
    exportReportPdf({
      title: 'Attendance Detail — Date-wise',
      subtitle: `${monthLabel}  ·  ${deptLabel}`,
      head: ['Emp Code', 'Employee Name', ...Array.from({ length: days }, (_, i) => i + 1)],
      aligns: ['left', 'left', ...Array.from({ length: days }, () => 'center')],
      body: dwFiltered.map((emp) => [
        emp.employeeCode, emp.name,
        ...Array.from({ length: days }, (_, i) => entries[`${emp.employeeId}_${i + 1}`] || ''),
      ]),
    })
  }

  const tabCls = (v) => `px-4 py-2 text-sm font-bold ${view === v ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Attendance Detail Report</h1>
        <div className="flex flex-wrap items-center gap-2 ml-auto justify-end">
          <SearchBox value={query} onChange={setQuery} placeholder="Search employee…" />
          {canExport && (
            <>
              <button onClick={view === 'breakup' ? exportBreakup : exportGrid} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-600 bg-green-600 text-white hover:bg-green-700 text-sm font-bold">
                <Download /> Export Excel
              </button>
              <button onClick={view === 'breakup' ? exportBreakupPdf : exportGridPdf} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-600 bg-red-600 text-white hover:bg-red-700 text-sm font-bold">
                <FileText /> Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* View toggle + right-aligned filters */}
      <div className="flex items-center flex-wrap gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
          <button onClick={() => switchView('breakup')} className={tabCls('breakup')}>Summary Breakup</button>
          <button onClick={() => switchView('datewise')} className={`${tabCls('datewise')} border-l border-slate-200 dark:border-white/10`}>Date-wise</button>
        </div>
        <div className="ml-auto">
          <PeriodFilter month={month} setMonth={setMonth} year={year} setYear={setYear} departmentId={departmentId} setDepartmentId={setDepartmentId} departments={departments} />
        </div>
      </div>

      {error && <div className="text-red-600 dark:text-red-400 font-bold text-sm">{error}</div>}

      {view === 'breakup' ? (
        /* ---------------- Breakup (compact single view) ---------------- */
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 font-bold text-sm">{monthLabel} · {deptLabel}</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
                <th className="text-left px-3 py-2.5 font-bold w-12">S.No</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className={`px-3 py-2.5 font-bold ${col.align === 'left' ? 'text-left' : 'text-center'}`}>
                    <div className={`flex items-center gap-1 ${col.align === 'left' ? 'justify-start' : 'justify-center'}`}>
                      <span>{col.label}</span>
                      <button onClick={() => setOpenCol(openCol === col.key ? null : col.key)} title={`Search ${col.label}`}
                        className={`p-0.5 rounded ${colFilters[col.key] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                        <Search size={12} />
                      </button>
                    </div>
                    {openCol === col.key && (
                      <div className="relative mt-1">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                        <input autoFocus value={colFilters[col.key] || ''} onChange={(e) => setColFilter(col.key, e.target.value)} placeholder="Search"
                          className="w-full min-w-[70px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal outline-none focus:border-blue-500" />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLUMNS.length + 1} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 1} className="px-4 py-6 text-center text-slate-400">No records.</td></tr>
              ) : (
                pageBreakup.map((r, i) => (
                  <tr key={r.employeeId} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className={`px-3 py-2 ${col.align === 'left' ? '' : 'text-center'}`}>{col.render(r)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ---------------- Date-wise grid ---------------- */
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1e2235] text-slate-500 dark:text-slate-400">
                <th style={{ width: 150 }} className="sticky left-0 z-20 bg-slate-50 dark:bg-[#1e2235] text-left px-3 py-2 font-bold border-r border-slate-200 dark:border-white/10 align-top">
                  <div className="flex items-center gap-1">
                    <span>Employee Name</span>
                    <button onClick={() => setEmpSearchOpen((o) => !o)} title="Search employee"
                      className={`p-0.5 rounded ${query ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                      <Search size={12} />
                    </button>
                  </div>
                  {empSearchOpen && (
                    <div className="relative mt-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                      <input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search"
                        className="w-full pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] font-normal normal-case outline-none focus:border-blue-500" />
                    </div>
                  )}
                </th>
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                  const wknd = isWeekend(d), hol = holidays.has(d)
                  return (
                    <th key={d} className={`px-0 py-1 font-bold text-center ${hol ? 'bg-amber-50 dark:bg-amber-500/10' : wknd ? 'bg-slate-100 dark:bg-white/5' : ''}`}>
                      <div>{d}</div>
                      <div className="text-[9px] opacity-60">{WD[dow(d)]}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={days + 1} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
              ) : dwFiltered.length === 0 ? (
                <tr><td colSpan={days + 1} className="px-4 py-6 text-center text-slate-400">No employees found.</td></tr>
              ) : (
                pageEmployees.map((emp) => (
                  <tr key={emp.employeeId} className="border-t border-slate-100 dark:border-white/5">
                    <td style={{ width: 150 }} className="sticky left-0 z-10 bg-white dark:bg-[#161925] px-3 py-1.5 font-bold truncate border-r border-slate-200 dark:border-white/10" title={`${emp.name} (${emp.employeeCode})`}>{emp.name}</td>
                    {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
                      const code = entries[`${emp.employeeId}_${d}`]
                      const wknd = isWeekend(d), hol = holidays.has(d)
                      return (
                        <td key={d} className={`text-center h-7 ${code ? CODE_CLS[code] || '' : hol ? 'bg-amber-50/60 dark:bg-amber-500/5' : wknd ? 'bg-slate-50 dark:bg-white/[0.03]' : ''}`}>
                          <span className="text-[11px] font-bold">{code || ''}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeList.length > 0 && (
        <Pagination total={activeList.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}

      {view === 'breakup' ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Gross Working Days = Present + Sick Leave + weekly-offs worked (bonus). Balance Carry Forward = Gross Working Days − Working Days.
        </p>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          P Present · PO Present Onsite · A Absent · L Leave · HD Half Day · H Holiday · WO Weekly Off. Grey = weekend · Amber = holiday. Read-only view.
        </p>
      )}
    </div>
  )
}
