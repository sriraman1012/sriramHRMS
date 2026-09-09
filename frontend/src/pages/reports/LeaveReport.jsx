import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getLeaves } from '../../api/leave.js'
import { getEmployees, getDepartments, getHolidays } from '../../api/masters.js'
import { getWeeklyOff } from '../../api/settings.js'
import { Download, Search, FileText } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import CopyButton from '../../components/CopyButton.jsx'
import { exportReportPdf } from '../../reportPdf.js'
import { isWeeklyOff } from '../../weeklyOff.js'
import { useRights } from '../../context/RightsContext.jsx'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => (d ? String(d).slice(0, 10) : '')
const selectCls = 'rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-base px-3 py-2 outline-none'

// Column config drives header, per-column search, cell render and export.
const COLUMNS = [
  {
    key: 'employee', label: 'Employee', align: 'left',
    get: (l) => `${l.employeeName} ${l.employeeCode}`,
    exportVal: (l) => l.employeeName,
    render: (l) => <span className="font-bold">{l.employeeName}</span>,
  },
  { key: 'leaveType', label: 'Leave Type', align: 'left', get: (l) => l.leaveTypeName || '', exportVal: (l) => l.leaveTypeName || '', render: (l) => l.leaveTypeName || '—' },
  { key: 'from', label: 'From', align: 'left', get: (l) => fmt(l.fromDate), exportVal: (l) => fmt(l.fromDate), render: (l) => fmt(l.fromDate) },
  { key: 'to', label: 'To', align: 'left', get: (l) => fmt(l.toDate), exportVal: (l) => fmt(l.toDate), render: (l) => fmt(l.toDate) },
  { key: 'days', label: 'Days', align: 'center', get: (l, days) => String(days), exportVal: (l, days) => days,
    render: (l, days) => <span className="font-bold text-amber-600 dark:text-amber-400">{days}</span> },
  { key: 'reason', label: 'Reason', align: 'left', get: (l) => l.reason || '', exportVal: (l) => l.reason || '', render: (l) => <span className="text-slate-500 dark:text-slate-400">{l.reason || '—'}</span> },
  { key: 'remarks', label: 'Remarks', align: 'left', get: (l) => l.remarks || '', exportVal: (l) => l.remarks || '', render: (l) => <span className="text-slate-500 dark:text-slate-400">{l.remarks || '—'}</span> },
]

export default function LeaveReport() {
  const { can } = useRights()
  const canExport = can('rpt-leave', 'export')
  const [range, setRange] = useState(() => {
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1) // previous month start
    return {
      from: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-01`,
      to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    }
  })
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [empDept, setEmpDept] = useState({})
  const [holidays, setHolidays] = useState(new Set())
  const [weeklyOff, setWeeklyOff] = useState({ days: [0, 6], nth: {} })
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
    getEmployees().then((emps) => {
      const map = {}
      for (const e of emps) map[e.employeeId] = e.departmentId
      setEmpDept(map)
    }).catch(() => {})
    getHolidays().then((hs) => setHolidays(new Set(hs.map((h) => fmt(h.holidayDate))))).catch(() => {})
    getWeeklyOff().then((r) => setWeeklyOff({ days: r.days || [], nth: r.nth || {} })).catch(() => {})
    getLeaves()
      .then(setLeaves)
      .catch(() => setError('Failed to load leaves. Is the API running / are you logged in?'))
      .finally(() => setLoading(false))
  }, [])

  const leaveDays = (from, to) => {
    if (!from || !to) return 0
    let count = 0
    const cur = new Date(from + 'T00:00:00')
    const end = new Date(to + 'T00:00:00')
    while (cur <= end) {
      const iso = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`
      if (!isWeeklyOff(cur, weeklyOff) && !holidays.has(iso)) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  }

  const gq = query.trim().toLowerCase()

  // Precompute days, then apply date-range/department/global/per-column filters
  const filtered = leaves
    .map((l) => ({ l, days: leaveDays(fmt(l.fromDate), fmt(l.toDate)) }))
    .filter(({ l, days }) => {
      const f = fmt(l.fromDate), t = fmt(l.toDate)
      if (!(f <= range.to && t >= range.from)) return false // leave overlaps the range
      if (departmentId && String(empDept[l.employeeId] || '') !== String(departmentId)) return false
      if (gq && !`${l.employeeCode} ${l.employeeName} ${l.leaveTypeName || ''} ${l.reason || ''} ${l.remarks || ''}`.toLowerCase().includes(gq)) return false
      for (const col of COLUMNS) {
        const cf = (colFilters[col.key] || '').trim().toLowerCase()
        if (cf && !col.get(l, days).toLowerCase().includes(cf)) return false
      }
      return true
    })

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)

  const rangeLabel = `${range.from} to ${range.to}`
  const deptLabel = departmentId ? departments.find((d) => String(d.departmentId) === String(departmentId))?.departmentName : 'All Departments'
  const setColFilter = (key, val) => setColFilters((prev) => ({ ...prev, [key]: val }))

  const exportExcel = () => {
    const header = ['S.No', ...COLUMNS.map((c) => c.label)]
    const body = filtered.map(({ l, days }, i) => [i + 1, ...COLUMNS.map((c) => c.exportVal(l, days))])
    const aoa = [['UNIPRO ATTENDANCE'], [`Leave Report - ${rangeLabel} - ${deptLabel}`], [], header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 22 }, { wch: 24 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leaves')
    XLSX.writeFile(wb, `Leave_Report_${range.from}_to_${range.to}.xlsx`)
  }

  const exportPdf = () => {
    exportReportPdf({
      title: 'Leave Report',
      subtitle: `${rangeLabel}  ·  ${deptLabel}`,
      head: ['S.No', ...COLUMNS.map((c) => c.label)],
      aligns: ['left', ...COLUMNS.map((c) => c.align)],
      body: filtered.map(({ l, days }, i) => [i + 1, ...COLUMNS.map((c) => c.exportVal(l, days))]),
    })
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Leave Report</h1>
        <div className="flex flex-wrap items-center gap-2 ml-auto justify-end">
          <SearchBox value={query} onChange={setQuery} placeholder="Search all…" />
          <CopyButton initial="Copy table" done="Copied!"
            getText={() => [['S.No', ...COLUMNS.map((c) => c.label)], ...filtered.map(({ l, days }, i) => [i + 1, ...COLUMNS.map((c) => c.exportVal(l, days))])].map((row) => row.join('\t')).join('\n')} />
          {canExport && (
            <>
              <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-600 bg-green-600 text-white hover:bg-green-700 text-sm font-bold">
                <Download /> Export Excel
              </button>
              <button onClick={exportPdf} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-600 bg-red-600 text-white hover:bg-red-700 text-sm font-bold">
                <FileText /> Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} departments={departments} departmentId={departmentId} setDepartmentId={setDepartmentId} />
      </div>

      {error && <div className="text-red-600 dark:text-red-400 font-bold text-sm">{error}</div>}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 font-bold text-sm">
          {rangeLabel} · {deptLabel}
        </div>
        <div className="overflow-x-auto">
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
                <tr><td colSpan={COLUMNS.length + 1} className="px-4 py-6 text-center text-slate-400">No leaves in this range.</td></tr>
              ) : (
                pageRows.map(({ l, days }, i) => (
                  <tr key={l.leaveId} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className={`px-3 py-2 ${col.align === 'left' ? '' : 'text-center'}`}>{col.render(l, days)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}
    </div>
  )
}
