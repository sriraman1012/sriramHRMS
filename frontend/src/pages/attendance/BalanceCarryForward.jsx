import { useEffect, useMemo, useState } from 'react'
import { useRights } from '../../context/RightsContext.jsx'
import * as XLSX from 'xlsx'
import { getSheet, getBalanceCf, saveBalanceCf } from '../../api/attendance.js'
import { getDepartments } from '../../api/masters.js'
import { getWeeklyOff, getWorkingDays } from '../../api/settings.js'
import { Download, Save, Search } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import PeriodFilter from '../../components/PeriodFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import { isWeeklyOff } from '../../weeklyOff.js'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const now = new Date()
const selectCls = 'rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-sm px-3 py-2 outline-none'
const fmt = (n) => Math.round((Number(n) || 0) * 10) / 10

export default function BalanceCarryForward() {
  const { can } = useRights()
  const canEdit = can('balance-cf', 'edit') || can('balance-cf', 'add')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [weeklyOff, setWeeklyOff] = useState({ days: [0, 6], nth: {} })
  const [employees, setEmployees] = useState([])
  const [holidays, setHolidays] = useState(new Set())
  const [entries, setEntries] = useState({})
  const [workingDays, setWorkingDays] = useState(0)
  const [saved, setSaved] = useState({}) // employeeId -> { deducted, remarks }
  const [edits, setEdits] = useState({}) // employeeId -> { deducted, remarks }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))
  const colText = {
    employee: (r) => `${r.name} ${r.code}`,
    carryForward: (r) => String(r.carryForward),
    deducted: (r) => String(r.deducted),
    balance: (r) => String(r.balance),
    remarks: (r) => r.remarks || '',
  }

  const days = useMemo(() => new Date(year, month, 0).getDate(), [year, month])
  const dow = (d) => new Date(year, month - 1, d).getDay()

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
    getWeeklyOff().then((r) => setWeeklyOff({ days: r.days || [], nth: r.nth || {} })).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    setMsg('')
    setEdits({})
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
        // Saved deductions/remarks (empty if the SP isn't created yet)
        const rows = await getBalanceCf(year, month).catch(() => [])
        const s = {}
        for (const r of rows || []) s[r.employeeId] = { deducted: r.deducted, remarks: r.remarks || '' }
        setSaved(s)
      })
      .catch(() => setError('Failed to load. Is the API running / are you logged in?'))
      .finally(() => setLoading(false))
  }, [year, month, departmentId, weeklyOff])

  const woMonth = Math.max(0, days - workingDays)

  // Compute carry-forward (Gross Working Days − Working Days) per employee + merge saved/edited deduction.
  const rows = useMemo(() => {
    return employees.map((emp) => {
      let present = 0, woWorked = 0
      for (let d = 1; d <= days; d++) {
        const wknd = isWeeklyOff(new Date(year, month - 1, d), weeklyOff)
        const hol = holidays.has(d)
        const code = entries[`${emp.employeeId}_${d}`]
        // Present Onsite (PO) counts exactly like Present for the carry-forward math.
        if (code === 'P' || code === 'PO') { if (wknd) woWorked++; else if (!hol) present++ }
      }
      const woBalance = Math.min(woWorked, woMonth)
      const carryForward = present + 1 /* sick */ + woBalance - workingDays
      const savedRow = saved[emp.employeeId] || {}
      const edit = edits[emp.employeeId] || {}
      const deducted = edit.deducted !== undefined ? edit.deducted : (savedRow.deducted ?? 0)
      const remarks = edit.remarks !== undefined ? edit.remarks : (savedRow.remarks ?? '')
      const balance = fmt(carryForward) - (Number(deducted) || 0)
      return { employeeId: emp.employeeId, name: emp.name, code: emp.employeeCode, carryForward: fmt(carryForward), deducted, remarks, balance: fmt(balance) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, entries, holidays, weeklyOff, workingDays, woMonth, days, saved, edits, year, month])

  const gq = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    if (gq && !`${r.name} ${r.code}`.toLowerCase().includes(gq)) return false
    for (const k of Object.keys(colFilters)) {
      const f = (colFilters[k] || '').trim().toLowerCase()
      if (f && !colText[k](r).toLowerCase().includes(f)) return false
    }
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)

  const totals = filtered.reduce(
    (a, r) => ({ cf: a.cf + r.carryForward, ded: a.ded + (Number(r.deducted) || 0), bal: a.bal + r.balance }),
    { cf: 0, ded: 0, bal: 0 },
  )

  const setEdit = (employeeId, field, value) =>
    setEdits((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [field]: value } }))

  const monthLabel = `${MONTHS[month - 1]} ${year}`
  const deptLabel = departmentId ? departments.find((d) => String(d.departmentId) === String(departmentId))?.departmentName : 'All Departments'

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const items = rows.map((r) => ({ employeeId: r.employeeId, carryForward: r.carryForward, deducted: Number(r.deducted) || 0, remarks: r.remarks || null }))
      await saveBalanceCf({ year, month, items })
      // move edits into saved
      const s = { ...saved }
      for (const r of rows) s[r.employeeId] = { deducted: Number(r.deducted) || 0, remarks: r.remarks || '' }
      setSaved(s)
      setEdits({})
      setMsg('Balance carry forward saved.')
      setTimeout(() => setMsg(''), 2500)
    } catch {
      setError('Could not save. Did you run 16_balance_cf.sql?')
    } finally {
      setSaving(false)
    }
  }

  const exportExcel = () => {
    const header = ['S.No', 'Emp Code', 'Employee', 'Carry Forward', 'Deducted', 'Balance', 'Remarks']
    const body = filtered.map((r, i) => [i + 1, r.code, r.name, r.carryForward, Number(r.deducted) || 0, r.balance, r.remarks || ''])
    const aoa = [['UNIPRO ATTENDANCE'], [`Balance Carry Forward - ${monthLabel} - ${deptLabel}`], [], header, ...body,
      [], ['', '', 'TOTAL', fmt(totals.cf), fmt(totals.ded), fmt(totals.bal), '']]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'BalanceCF')
    XLSX.writeFile(wb, `Balance_Carry_Forward_${MONTHS[month - 1]}_${year}.xlsx`)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2">💰 Balance Carry Forward</h1>
        <div className="flex gap-2">
          {canEdit && (
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">
              <Save /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-600 bg-green-600 text-white hover:bg-green-700 text-sm font-bold">
            <Download /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <PeriodFilter month={month} setMonth={setMonth} year={year} setYear={setYear} departmentId={departmentId} setDepartmentId={setDepartmentId} departments={departments} />
        <SearchBox value={query} onChange={setQuery} placeholder="Search employee…" className="ml-auto" />
      </div>

      {(msg || error) && (
        <div className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{error || msg}</div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 font-bold text-sm">{monthLabel} · {deptLabel}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
                <th className="text-left px-3 py-2.5 font-bold w-12">S.No</th>
                {[
                  { key: 'employee', label: 'Employee', align: 'left' },
                  { key: 'carryForward', label: 'Carry Forward', align: 'center' },
                  { key: 'deducted', label: 'Deducted', align: 'center' },
                  { key: 'balance', label: 'Balance', align: 'center' },
                  { key: 'remarks', label: 'Remarks', align: 'left' },
                ].map((c) => (
                  <th key={c.key} className={`px-3 py-2.5 font-bold ${c.align === 'left' ? 'text-left' : 'text-center'}`}>
                    <div className={`flex items-center gap-1 ${c.align === 'left' ? 'justify-start' : 'justify-center'}`}>
                      <span>{c.label}</span>
                      <button onClick={() => setOpenCol(openCol === c.key ? null : c.key)} title={`Search ${c.label}`}
                        className={`p-0.5 rounded ${colFilters[c.key] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                        <Search size={12} />
                      </button>
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
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No employees.</td></tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={r.employeeId} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                    <td className="px-3 py-2 font-bold">{r.name}</td>
                    <td className="px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400">{r.carryForward}</td>
                    <td className="px-3 py-2 text-center">
                      <input type="number" step="0.5" value={r.deducted} readOnly={!canEdit} disabled={!canEdit}
                        onChange={(e) => setEdit(r.employeeId, 'deducted', e.target.value)}
                        className="w-20 text-center rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2 py-1 text-sm outline-none focus:border-blue-500 disabled:opacity-60" />
                    </td>
                    <td className={`px-3 py-2 text-center font-bold ${r.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{r.balance}</td>
                    <td className="px-3 py-2">
                      <input value={r.remarks} readOnly={!canEdit} disabled={!canEdit}
                        onChange={(e) => setEdit(r.employeeId, 'remarks', e.target.value)}
                        placeholder="Reason for deduction…"
                        className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2 py-1 text-sm outline-none focus:border-blue-500 disabled:opacity-60" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e2235] font-bold">
                  <td className="px-3 py-2.5" colSpan={2}>Total ({filtered.length})</td>
                  <td className="px-3 py-2.5 text-center text-blue-600 dark:text-blue-400">{fmt(totals.cf)}</td>
                  <td className="px-3 py-2.5 text-center">{fmt(totals.ded)}</td>
                  <td className="px-3 py-2.5 text-center text-green-600 dark:text-green-400">{fmt(totals.bal)}</td>
                  <td className="px-3 py-2.5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Carry Forward = Gross Working Days − Working Days (from Attendance Detail). Enter a manual <b>Deducted</b> value and Remarks, then <b>Save</b>. Balance = Carry Forward − Deducted.
      </p>
    </div>
  )
}
