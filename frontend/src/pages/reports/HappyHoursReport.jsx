import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { getHappyHours } from '../../api/masters.js'
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
const to12h = (t) => {
  if (!t) return ''
  const [h, m] = String(t).split(':')
  let hh = Number(h)
  if (Number.isNaN(hh)) return t
  const ap = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `${hh}:${m ?? '00'} ${ap}`
}

const COLS = [
  { key: 'title', label: 'Title', align: 'left', get: (r) => r.title || '', render: (r) => <span className="font-bold">{r.title}</span> },
  { key: 'day', label: 'Day', align: 'left', get: (r) => r.dayName || '', render: (r) => r.dayName || '—' },
  { key: 'date', label: 'Date', align: 'left', get: (r) => fmtDate(r.eventDate), render: (r) => fmtDate(r.eventDate) || '—' },
  { key: 'start', label: 'Start Time', align: 'center', get: (r) => to12h(r.startTime), render: (r) => to12h(r.startTime) || '—' },
  { key: 'end', label: 'End Time', align: 'center', get: (r) => to12h(r.endTime), render: (r) => to12h(r.endTime) || '—' },
  { key: 'location', label: 'Location Address', align: 'left', get: (r) => r.locationAddress || '', render: (r) => <span className="text-slate-500 dark:text-slate-400">{r.locationAddress || '—'}</span> },
  { key: 'status', label: 'Status', align: 'center', get: (r) => (r.isActive ? 'Active' : 'Inactive'), render: (r) => <span className={`font-bold ${r.isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>{r.isActive ? 'Active' : 'Inactive'}</span> },
]

export default function HappyHoursReport() {
  const { can } = useRights()
  const canExport = can('rpt-happy-hours', 'export')
  const [range, setRange] = useState(() => {
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1) // previous month start
    return {
      from: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-01`,
      to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    }
  })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setLoading(true); setError('')
    getHappyHours().then(setRows).catch(() => setError('Failed to load. Did you run 25_happy_hours.sql?')).finally(() => setLoading(false))
  }, [])

  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))
  const gq = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    // Entries with a date must fall in the range; undated (recurring by weekday) always show.
    const d = fmtDate(r.eventDate)
    if (d && !(d >= range.from && d <= range.to)) return false
    if (gq && !`${r.title} ${r.dayName || ''} ${r.locationAddress || ''}`.toLowerCase().includes(gq)) return false
    for (const c of COLS) { const f = (colFilters[c.key] || '').trim().toLowerCase(); if (f && !c.get(r).toLowerCase().includes(f)) return false }
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)

  const exportExcel = () => {
    const header = ['S.No', ...COLS.map((c) => c.label)]
    const body = filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.get(r))])
    const aoa = [['UNIPRO ATTENDANCE'], ['Happy Hours Report'], [], header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 6 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Happy Hours')
    XLSX.writeFile(wb, 'Happy_Hours_Report.xlsx')
  }

  const exportPdf = () => {
    exportReportPdf({
      title: 'Happy Hours Report',
      head: ['S.No', ...COLS.map((c) => c.label)],
      aligns: ['left', ...COLS.map((c) => c.align)],
      body: filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.get(r))]),
    })
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Happy Hours Report</h1>
        <div className="flex flex-wrap items-center gap-2 ml-auto justify-end">
          <SearchBox value={query} onChange={setQuery} placeholder="Search all…" />
          <CopyButton initial="Copy table" done="Copied!"
            getText={() => [['S.No', ...COLS.map((c) => c.label)], ...filtered.map((r, i) => [i + 1, ...COLS.map((c) => c.get(r))])].map((row) => row.join('\t')).join('\n')} />
          {canExport && (<>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-600 bg-green-600 text-white hover:bg-green-700 text-sm font-bold"><Download /> Export Excel</button>
          <button onClick={exportPdf} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-600 bg-red-600 text-white hover:bg-red-700 text-sm font-bold"><FileText /> Export PDF</button>
          </>)}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
      </div>

      {error && <div className="text-red-600 dark:text-red-400 font-bold text-sm">{error}</div>}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-hidden">
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
                : filtered.length === 0 ? <tr><td colSpan={COLS.length + 1} className="px-4 py-6 text-center text-slate-400">No happy hours.</td></tr>
                  : pageRows.map((r, i) => (
                    <tr key={r.happyHourId} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                      {COLS.map((c) => <td key={c.key} className={`px-3 py-2 ${c.align === 'left' ? '' : 'text-center'}`}>{c.render(r)}</td>)}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />}
    </div>
  )
}
