import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getHome } from '../../api/dashboard.js'
import { getDepartments } from '../../api/masters.js'
import { Download, Search, FileText } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import PeriodFilter from '../../components/PeriodFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import CopyButton from '../../components/CopyButton.jsx'
import { exportReportPdf } from '../../reportPdf.js'
import { useRights } from '../../context/RightsContext.jsx'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const now = new Date()
const isoToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const fmt = (n) => Math.round((Number(n) || 0) * 10) / 10
const selectCls = 'rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-base px-3 py-2 outline-none'

const compute = (r) => ({
  total: r.workingDays - r.leaveDays + r.holidaysWorking + r.sickLeave,
  extra: r.holidaysWorking + r.sickLeave - r.leaveDays,
})

// Column config drives header, per-column search, cell render and Excel export.
const COLUMNS = [
  {
    key: 'employee', label: 'Employee', align: 'left', exportKey: 'Employee',
    get: (r) => `${r.name} ${r.employeeCode}`,
    exportVal: (r) => r.name,
    render: (r) => <span className="font-bold">{r.name}</span>,
  },
  { key: 'leaveDays', label: 'Leave Days', align: 'center', get: (r) => String(fmt(r.leaveDays)), exportVal: (r) => fmt(r.leaveDays),
    render: (r) => <span className="font-bold text-amber-600 dark:text-amber-400">{fmt(r.leaveDays)}</span> },
  { key: 'sickLeave', label: 'Sick Leave', align: 'center', get: (r) => String(fmt(r.sickLeave)), exportVal: (r) => fmt(r.sickLeave),
    render: (r) => <span className="text-slate-600 dark:text-slate-300">{fmt(r.sickLeave)}</span> },
  { key: 'workingDays', label: 'Working Days', align: 'center', get: (r) => String(r.workingDays), exportVal: (r) => r.workingDays,
    render: (r) => <span className="text-slate-600 dark:text-slate-300">{r.workingDays}</span> },
  { key: 'holidaysWorking', label: 'Holidays Working', align: 'center', get: (r) => String(r.holidaysWorking), exportVal: (r) => r.holidaysWorking,
    render: (r) => <span className="text-green-600 dark:text-green-400">{r.holidaysWorking}</span> },
  { key: 'total', label: 'Total', align: 'center', get: (r, c) => String(fmt(c.total)), exportVal: (r, c) => fmt(c.total),
    render: (r, c) => <span className="font-bold">{fmt(c.total)}</span> },
  { key: 'extra', label: 'Extra Working Days', align: 'center', get: (r, c) => String(fmt(c.extra)), exportVal: (r, c) => fmt(c.extra),
    render: (r, c) => <span className={`font-bold ${c.extra >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{fmt(c.extra)}</span> },
]

export default function EmployeeSummaryReport() {
  const { can } = useRights()
  const canExport = can('rpt-summary', 'export')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    getHome(year, month, departmentId, isoToday)
      .then((d) => setRows(d.employeeSummary || []))
      .catch(() => setError('Failed to load report. Is the API running / are you logged in?'))
      .finally(() => setLoading(false))
  }, [year, month, departmentId])

  const monthLabel = `${MONTHS[month - 1]} ${year}`
  const deptLabel = departmentId ? departments.find((d) => String(d.departmentId) === String(departmentId))?.departmentName : 'All Departments'

  // Apply global + per-column filters
  const gq = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    const c = compute(r)
    if (gq && !`${r.employeeCode} ${r.name}`.toLowerCase().includes(gq)) return false
    for (const col of COLUMNS) {
      const f = (colFilters[col.key] || '').trim().toLowerCase()
      if (f && !col.get(r, c).toLowerCase().includes(f)) return false
    }
    return true
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)

  const setColFilter = (key, val) => setColFilters((prev) => ({ ...prev, [key]: val }))

  const exportExcel = () => {
    const header = ['S.No', ...COLUMNS.map((c) => (c.exportKey || c.label))]
    const body = filtered.map((r, i) => {
      const c = compute(r)
      return [i + 1, ...COLUMNS.map((col) => col.exportVal(r, c))]
    })
    const aoa = [['UNIPRO ATTENDANCE'], [`Employee-wise Summary - ${monthLabel} - ${deptLabel}`], [], header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 11 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Summary')
    XLSX.writeFile(wb, `Employee_Summary_${MONTHS[month - 1]}_${year}.xlsx`)
  }

  const exportPdf = () => {
    exportReportPdf({
      title: 'Employee-wise Summary Report',
      subtitle: `${monthLabel}  ·  ${deptLabel}`,
      head: ['S.No', ...COLUMNS.map((c) => c.label)],
      aligns: ['left', ...COLUMNS.map((c) => c.align)],
      body: filtered.map((r, i) => {
        const c = compute(r)
        return [i + 1, ...COLUMNS.map((col) => col.exportVal(r, c))]
      }),
    })
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Employee-wise Summary Report</h1>
        <div className="flex flex-wrap items-center gap-2 ml-auto justify-end">
          <SearchBox value={query} onChange={setQuery} placeholder="Search all…" />
          <CopyButton initial="Copy table" done="Copied!"
            getText={() => [['S.No', ...COLUMNS.map((c) => c.label)], ...filtered.map((r, i) => { const c = compute(r); return [i + 1, ...COLUMNS.map((col) => col.exportVal(r, c))] })].map((row) => row.join('\t')).join('\n')} />
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

      {/* Filters (right-aligned pills) */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <PeriodFilter month={month} setMonth={setMonth} year={year} setYear={setYear} departmentId={departmentId} setDepartmentId={setDepartmentId} departments={departments} />
      </div>

      {error && <div className="text-red-600 dark:text-red-400 font-bold text-sm">{error}</div>}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 font-bold text-sm">
          {monthLabel} · {deptLabel}
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
                        <input
                          autoFocus
                          value={colFilters[col.key] || ''}
                          onChange={(e) => setColFilter(col.key, e.target.value)}
                          placeholder="Search"
                          className="w-full min-w-[70px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal outline-none focus:border-blue-500"
                        />
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
                pageRows.map((r, i) => {
                  const c = compute(r)
                  return (
                    <tr key={r.employeeCode} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={`px-3 py-2 ${col.align === 'left' ? '' : 'text-center'}`}>{col.render(r, c)}</td>
                      ))}
                    </tr>
                  )
                })
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
