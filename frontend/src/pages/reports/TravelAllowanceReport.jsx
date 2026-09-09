import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getTravelAdvances } from '../../api/travel.js'
import { getDepartments } from '../../api/masters.js'
import { Download, Search, FileText, Eye, Paperclip } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import CopyButton from '../../components/CopyButton.jsx'
import TravelDetailModal from '../../components/TravelDetailModal.jsx'
import { exportReportPdf } from '../../reportPdf.js'
import { useRights } from '../../context/RightsContext.jsx'

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => (d ? String(d).slice(0, 10) : '')
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const money = (n) => num(n).toFixed(2)

const COLS = [
  { key: 'employee', label: 'Employee', align: 'left', get: (r) => `${r.employeeName} ${r.employeeCode}`, xl: (r) => r.employeeName, render: (r) => <span className="font-bold">{r.employeeName}</span> },
  { key: 'department', label: 'Department', align: 'left', get: (r) => r.departmentName || '', xl: (r) => r.departmentName || '', render: (r) => <span className="text-slate-500 dark:text-slate-400">{r.departmentName || '—'}</span> },
  { key: 'client', label: 'Client', align: 'left', get: (r) => r.clientName || '', xl: (r) => r.clientName || '', render: (r) => r.clientName },
  { key: 'location', label: 'Location', align: 'left', get: (r) => r.clientLocation || '', xl: (r) => r.clientLocation || '', render: (r) => <span className="text-slate-500 dark:text-slate-400">{r.clientLocation}</span> },
  { key: 'travel', label: 'Travel', align: 'left', get: (r) => `${fmt(r.travelStartDate)} ${fmt(r.travelEndDate)}`, xl: (r) => `${fmt(r.travelStartDate)} → ${fmt(r.travelEndDate)}`, render: (r) => <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{fmt(r.travelStartDate)} → {fmt(r.travelEndDate)}</span> },
  { key: 'days', label: 'Days', align: 'center', get: (r) => String(r.onsiteDays), xl: (r) => r.onsiteDays, render: (r) => r.onsiteDays },
  { key: 'advance', label: 'Advance', align: 'right', get: (r) => money(r.advanceAmount), xl: (r) => num(r.advanceAmount), render: (r) => <span className="tabular-nums">{money(r.advanceAmount)}</span> },
  { key: 'expense', label: 'Expense', align: 'right', get: (r) => money(r.totalExpense), xl: (r) => num(r.totalExpense), render: (r) => <span className="tabular-nums">{money(r.totalExpense)}</span> },
  { key: 'balance', label: 'Balance', align: 'right', get: (r) => money(r.balanceAmount), xl: (r) => num(r.balanceAmount), render: (r) => <span className={`tabular-nums font-bold ${num(r.balanceAmount) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{money(r.balanceAmount)}</span> },
  { key: 'status', label: 'Status', align: 'center', get: (r) => r.approvalStatus || '', xl: (r) => r.approvalStatus || '', render: (r) => r.approvalStatus },
]

// Detail sheet/section — full expense breakdown per record.
const DETAIL_COLS = [
  { label: 'Employee', val: (r) => r.employeeName || '' },
  { label: 'Code', val: (r) => r.employeeCode || '' },
  { label: 'Department', val: (r) => r.departmentName || '' },
  { label: 'Client', val: (r) => r.clientName || '' },
  { label: 'Location', val: (r) => r.clientLocation || '' },
  { label: 'Start', val: (r) => fmt(r.travelStartDate) },
  { label: 'End', val: (r) => fmt(r.travelEndDate) },
  { label: 'Onsite Days', val: (r) => r.onsiteDays },
  { label: 'Advance', val: (r) => num(r.advanceAmount) },
  { label: 'Bus', val: (r) => num(r.busTicket) },
  { label: 'Train', val: (r) => num(r.trainTicket) },
  { label: 'Flight', val: (r) => num(r.flightTicket) },
  { label: 'Bike', val: (r) => num(r.bikeExpense) },
  { label: 'Taxi', val: (r) => num(r.taxi) },
  { label: 'Hotel', val: (r) => num(r.hotelBill) },
  { label: 'Food', val: (r) => num(r.foodBill) },
  { label: 'Other', val: (r) => num(r.otherExpense) },
  { label: 'Total', val: (r) => num(r.totalExpense) },
  { label: 'Balance', val: (r) => num(r.balanceAmount) },
  { label: 'Status', val: (r) => r.approvalStatus || '' },
  { label: 'Approved By', val: (r) => r.approvedBy || '' },
  { label: 'Remarks', val: (r) => r.remarks || '' },
]

export default function TravelAllowanceReport() {
  const { can } = useRights()
  const canExport = can('rpt-travel-allowance', 'export')
  const [range, setRange] = useState(() => {
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return { from: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-01`, to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` }
  })
  const [departmentId, setDepartmentId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departments, setDepartments] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [viewId, setViewId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}) }, [])
  useEffect(() => {
    setLoading(true); setError('')
    getTravelAdvances(range.from, range.to, departmentId, statusFilter)
      .then(setRows).catch(() => setError('Failed to load report. Did you run 33/34_travel*.sql and restart the API?')).finally(() => setLoading(false))
  }, [range, departmentId, statusFilter])

  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))
  const gq = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    if (gq && !`${r.employeeName} ${r.employeeCode} ${r.clientName} ${r.clientLocation}`.toLowerCase().includes(gq)) return false
    for (const c of COLS) { const f = (colFilters[c.key] || '').trim().toLowerCase(); if (f && !c.get(r).toLowerCase().includes(f)) return false }
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)
  const totAdv = filtered.reduce((a, r) => a + num(r.advanceAmount), 0)
  const totExp = filtered.reduce((a, r) => a + num(r.totalExpense), 0)

  const rangeLabel = `${range.from} to ${range.to}`
  const deptLabel = departmentId ? departments.find((d) => String(d.departmentId) === String(departmentId))?.departmentName : 'All Departments'

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    // Sheet 1 — Summary
    const sHead = ['S.No', ...COLS.map((c) => c.label)]
    const sBody = filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.xl(r))])
    const ws1 = XLSX.utils.aoa_to_sheet([['UNIPRO ATTENDANCE'], [`Travel Allowance — Summary — ${rangeLabel} — ${deptLabel}`], [], sHead, ...sBody])
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')
    // Sheet 2 — Detail (expense breakdown)
    const dHead = ['S.No', ...DETAIL_COLS.map((c) => c.label)]
    const dBody = filtered.map((r, i) => [i + 1, ...DETAIL_COLS.map((c) => c.val(r))])
    const ws2 = XLSX.utils.aoa_to_sheet([['UNIPRO ATTENDANCE'], [`Travel Allowance — Detail — ${rangeLabel} — ${deptLabel}`], [], dHead, ...dBody])
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail')
    XLSX.writeFile(wb, `Travel_Allowance_${range.from}_to_${range.to}.xlsx`)
  }
  const exportPdf = () => {
    exportReportPdf({
      title: 'Travel Allowance Report', subtitle: `${rangeLabel}  ·  ${deptLabel}`,
      head: ['S.No', ...COLS.map((c) => c.label)], aligns: ['left', ...COLS.map((c) => c.align)],
      body: filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.xl(r))]),
      sections: [{
        heading: `Detail — Expense Breakdown (${rangeLabel})`,
        head: ['S.No', ...DETAIL_COLS.map((c) => c.label)],
        body: filtered.map((r, i) => [i + 1, ...DETAIL_COLS.map((c) => c.val(r))]),
      }],
    })
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Travel Allowance Report</h1>
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-xs font-bold px-2 outline-none">
          <option value="">All statuses</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
        </select>
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} departments={departments} departmentId={departmentId} setDepartmentId={setDepartmentId} />
      </div>

      {error && <div className="text-red-600 dark:text-red-400 font-bold text-sm">{error}</div>}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 font-bold text-sm">{rangeLabel} · {deptLabel}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead>
              <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
                <th className="text-left px-3 py-2.5 font-bold w-12">S.No</th>
                {COLS.map((c) => (
                  <th key={c.key} className={`px-3 py-2.5 font-bold ${c.align === 'left' ? 'text-left' : c.align === 'right' ? 'text-right' : 'text-center'}`}>
                    <div className={`flex items-center gap-1 ${c.align === 'left' ? 'justify-start' : c.align === 'right' ? 'justify-end' : 'justify-center'}`}>
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
                <th className="text-center px-3 py-2.5 font-bold w-16">View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={COLS.length + 2} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={COLS.length + 2} className="px-4 py-6 text-center text-slate-400">No travel allowances in this range.</td></tr>
                  : pageRows.map((r, i) => (
                    <tr key={r.travelId} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                      {COLS.map((c) => <td key={c.key} className={`px-3 py-2 ${c.align === 'left' ? '' : c.align === 'right' ? 'text-right' : 'text-center'}`}>{c.render(r)}</td>)}
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => setViewId(r.travelId)} title="View details & documents" className="inline-flex items-center justify-center gap-1 w-auto px-2 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                          <Eye size={16} />{r.hasDocs && <Paperclip size={12} />}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="border-t-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e2235] font-bold">
                <td className="px-3 py-2.5" colSpan={7}>Total ({filtered.length})</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totAdv)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totExp)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(totAdv - totExp)}</td>
                <td colSpan={2} />
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>

      {filtered.length > 0 && <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />}

      {viewId && <TravelDetailModal travelId={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}
