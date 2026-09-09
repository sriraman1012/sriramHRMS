import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getOnsite } from '../../api/attendance.js'
import { getDepartments } from '../../api/masters.js'
import { Download, Search, FileText } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import CopyButton from '../../components/CopyButton.jsx'
import { exportReportPdf } from '../../reportPdf.js'
import { useRights } from '../../context/RightsContext.jsx'

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const fmtDate = (d) => (d ? String(d).slice(0, 10) : '')

const COLS = [
  { key: 'employee', label: 'Employee', align: 'left', get: (r) => `${r.employeeName} ${r.employeeCode}`, xl: (r) => r.employeeName, render: (r) => <span className="font-bold">{r.employeeName}</span> },
  { key: 'department', label: 'Department', align: 'left', get: (r) => r.departmentName || '', xl: (r) => r.departmentName || '', render: (r) => <span className="text-slate-500 dark:text-slate-400">{r.departmentName || '—'}</span> },
  { key: 'date', label: 'Date', align: 'left', get: (r) => fmtDate(r.onsiteDate), xl: (r) => fmtDate(r.onsiteDate), render: (r) => fmtDate(r.onsiteDate) },
  { key: 'place', label: 'Onsite Place', align: 'left', get: (r) => r.place || '', xl: (r) => r.place || '', render: (r) => <span className="font-bold text-teal-700 dark:text-teal-300">{r.place || '—'}</span> },
]

export default function OnsiteReport() {
  const { can } = useRights()
  const canExport = can('rpt-onsite', 'export')
  const [range, setRange] = useState(() => {
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1) // previous month start
    return {
      from: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-01`,
      to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    }
  })
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

  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}) }, [])
  useEffect(() => {
    setLoading(true); setError('')
    // Load all onsite entries for the (optional) department; the date range is applied client-side.
    getOnsite(null, null, departmentId).then(setRows).catch(() => setError('Failed to load report. Did you run 24_onsite_report.sql?')).finally(() => setLoading(false))
  }, [departmentId])

  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))
  const gq = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    const d = fmtDate(r.onsiteDate)
    if (!(d >= range.from && d <= range.to)) return false
    if (gq && !`${r.employeeName} ${r.employeeCode} ${r.place || ''}`.toLowerCase().includes(gq)) return false
    for (const c of COLS) { const f = (colFilters[c.key] || '').trim().toLowerCase(); if (f && !c.get(r).toLowerCase().includes(f)) return false }
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)

  const rangeLabel = `${range.from} to ${range.to}`
  const deptLabel = departmentId ? departments.find((d) => String(d.departmentId) === String(departmentId))?.departmentName : 'All Departments'

  const exportExcel = () => {
    const header = ['S.No', ...COLS.map((c) => c.label)]
    const body = filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.xl(r))])
    const aoa = [['UNIPRO ATTENDANCE'], [`Onsite Report - ${rangeLabel} - ${deptLabel}`], [], header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 28 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Onsite')
    XLSX.writeFile(wb, `Onsite_Report_${range.from}_to_${range.to}.xlsx`)
  }

  const exportPdf = () => {
    exportReportPdf({
      title: 'Onsite Report',
      subtitle: `${rangeLabel}  ·  ${deptLabel}`,
      head: ['S.No', ...COLS.map((c) => c.label)],
      aligns: ['left', ...COLS.map((c) => c.align)],
      body: filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.xl(r))]),
    })
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Onsite Report</h1>
        <div className="flex flex-wrap items-center gap-2 ml-auto justify-end">
          <SearchBox value={query} onChange={setQuery} placeholder="Search all…" />
          <CopyButton initial="Copy table" done="Copied!"
            getText={() => [['S.No', ...COLS.map((c) => c.label)], ...filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.xl(r))])].map((row) => row.join('\t')).join('\n')} />
          {canExport && (<>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-600 bg-green-600 text-white hover:bg-green-700 text-sm font-bold"><Download /> Export Excel</button>
          <button onClick={exportPdf} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-600 bg-red-600 text-white hover:bg-red-700 text-sm font-bold"><FileText /> Export PDF</button>
          </>)}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} departments={departments} departmentId={departmentId} setDepartmentId={setDepartmentId} />
      </div>

      {error && <div className="text-red-600 dark:text-red-400 font-bold text-sm">{error}</div>}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 font-bold text-sm">{rangeLabel} · {deptLabel}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
                <th className="text-left px-3 py-2.5 font-bold w-12">S.No</th>
                {COLS.map((c) => (
                  <th key={c.key} className={`px-3 py-2.5 font-bold ${c.align === 'left' ? 'text-left' : 'text-center'}`}>
                    <div className={`flex items-center gap-1 ${c.align === 'left' ? 'justify-start' : 'justify-center'}`}>
                      <span>{c.label}</span>
                      <button onClick={() => setOpenCol(openCol === c.key ? null : c.key)} title={`Search ${c.label}`}
                        className={`p-0.5 rounded ${colFilters[c.key] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><Search size={12} /></button>
                    </div>
                    {openCol === c.key && (
                      <div className="relative mt-1">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                        <input autoFocus value={colFilters[c.key] || ''} onChange={(e) => setColFilter(c.key, e.target.value)} placeholder="Search"
                          className="w-full min-w-[70px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal outline-none focus:border-blue-500" />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={COLS.length + 1} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={COLS.length + 1} className="px-4 py-6 text-center text-slate-400">No onsite entries in this range.</td></tr>
                  : pageRows.map((r, i) => (
                    <tr key={r.attendanceId} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                      {COLS.map((c) => <td key={c.key} className={`px-3 py-2 ${c.align === 'left' ? '' : 'text-center'}`}>{c.render(r)}</td>)}
                    </tr>
                  ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="border-t-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e2235] font-bold">
                <td className="px-3 py-2.5" colSpan={COLS.length + 1}>Total ({filtered.length})</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>

      {filtered.length > 0 && <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />}
    </div>
  )
}
